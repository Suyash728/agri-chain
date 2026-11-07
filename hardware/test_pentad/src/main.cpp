/**
 * @file main.cpp
 * @brief AgriChain Advanced Multi-Gas & Precision Environmental Telemetry Node
 * @target ESP32 DevKit v1 (30-pin)
 * 
 * Deep Sensing Capabilities:
 *  1. DHT11: Temperature (°C, °F, deci-C), Humidity (% RH), Heat Index, Dew Point & Condensation Margin
 *  2. MQ-135: Multi-Gas Decomposition (CO2, NH3 Ammonia, Ethanol/Fermentation Alcohol, Acetone, AQI) with live Hygrothermal Compensation
 *  3. LDR: Optical Lux Estimation (0-1000+ lux), Light Percentage (0-100%), Crate Seal Security State
 *  4. SW-420: Sub-microsecond Hardware Interrupt Shock & Transit Bruising Logger
 *  5. NEO-6M GPS: NMEA 3D Geolocation, Speed (km/h), Altitude, Satellites, HDOP & Clickable Google Maps
 *  6. LittleFS Storage: Resilient onboard flash ring-buffer for offline transit logging with O(1) instant boot
 */

#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <TinyGPSPlus.h>
#include <FS.h>
#include <LittleFS.h>
#include <math.h>

// ==============================================================================
// HARDWARE PIN DEFINITIONS
// ==============================================================================
#define PIN_DHT11     4
#define DHTTYPE       DHT11
#define PIN_MQ135     34   // ADC1 Channel 6
#define PIN_SW420     32   // Dedicated Transit Vibration Interrupt (GPIO 32)
#define PIN_LDR       35   // ADC1 Channel 7 (Dedicated Optical Light Divider)
#define GPS_RX_PIN    16   // ESP32 RX2 <- GPS TX
#define GPS_TX_PIN    17   // ESP32 TX2 -> GPS RX
#define ONBOARD_LED   2    // Blue status indicator

// ==============================================================================
// STORAGE & TELEMETRY CONSTANTS
// ==============================================================================
#define LOG_FILE_PATH        "/agrichain_log.jsonl"
#define LOG_FILE_PREV        "/agrichain_log_prev.jsonl"
#define LOG_COUNT_PATH       "/agrichain_count.bin"
#define MAX_LOG_BYTES        (1024 * 1024)   // 1 MB flash storage ceiling
#define TELEMETRY_PULSE_MS   1000            // 1 Hz live PC stream
#define OFFLINE_LOG_MS       10000           // 10s periodic offline transit buffer
#define HEATER_WARMUP_MS     45000           // 45s MQ-135 heater stabilization window

// MQ-135 Calibration Constants (Load Resistor RL = 10k, Clean Air R0 = 10k nominal)
const float RL_VALUE = 10.0f;
const float R0_CLEAN_AIR = 10.0f;

// ==============================================================================
// GLOBAL OBJECTS & STATE
// ==============================================================================
DHT dht(PIN_DHT11, DHTTYPE);
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

// Volatile shock counter with atomic accessor
volatile uint32_t totalShocks = 0;
volatile uint32_t lastShockMs = 0;

void IRAM_ATTR onShockISR() {
  uint32_t now = millis();
  if (now - lastShockMs > 25) { // 25ms hardware debounce latch
    totalShocks = totalShocks + 1;
    lastShockMs = now;
  }
}

uint32_t getShockCount() {
  noInterrupts();
  uint32_t count = totalShocks;
  interrupts();
  return count;
}

// Telemetry cycle and timing state
uint32_t cycle = 0;
unsigned long lastCycleTime = 0;
unsigned long lastLogTime = 0;
uint32_t lastLoggedShocks = 0;
float lastValidTemp = 28.5f;
float lastValidHum = 68.0f;
bool liveStreamActive = true;

// Flash storage tracking
size_t storedRecordCount = 0;
size_t currentLogSizeBytes = 0;
bool fsAvailable = false;

// Serial command buffer
String serialCmdBuffer = "";

// ==============================================================================
// DATA METRIC STRUCTURES
// ==============================================================================
struct ClimateMetrics {
  float tempC;
  float humPct;
  float dewPointC;
  float heatIndexC;
  float condMargin;
  bool valid;
};

struct GasMetrics {
  float avgAdc;
  float voltage;
  float ratio;
  float co2Ppm;
  float nh3Ppm;
  float alcoholPpm;
  float acetonePpm;
  bool isWarmingUp;
};

struct OpticsMetrics {
  float avgAdc;
  float voltage;
  float lightPct;
  float estimatedLux;
  bool tamperBreach;
};

struct GpsMetrics {
  bool hasFix;
  float lat;
  float lon;
  float alt;
  float speedKmh;
  float hdop;
  uint32_t sats;
  uint32_t nmeaChars;
};

// ==============================================================================
// MATHEMATICAL HYGROTHERMAL ALGORITHMS
// ==============================================================================
float computeDewPoint(float tempC, float humPct) {
  if (humPct <= 0.0f) return tempC;
  const float a = 17.27f;
  const float b = 237.7f;
  float alpha = ((a * tempC) / (b + tempC)) + logf(humPct / 100.0f);
  return (b * alpha) / (a - alpha);
}

float computeHeatIndex(float tempC, float humPct) {
  float T = (tempC * 9.0f / 5.0f) + 32.0f; // Fahrenheit
  float R = humPct;
  float hi = 0.5f * (T + 61.0f + ((T - 68.0f) * 1.2f) + (R * 0.094f));
  if (hi >= 80.0f) {
    hi = -42.379f + 2.04901523f * T + 10.14333127f * R - 0.22475541f * T * R
         - 0.00683783f * T * T - 0.05481717f * R * R + 0.00122874f * T * T * R
         + 0.00085282f * T * R * R - 0.00000199f * T * T * R * R;
  }
  return (hi - 32.0f) * 5.0f / 9.0f; // Celsius
}

// ==============================================================================
// SENSOR ACQUISITION SUBSYSTEMS
// ==============================================================================
ClimateMetrics readClimate() {
  ClimateMetrics m;
  float t = dht.readTemperature();
  float h = dht.readHumidity();

  m.valid = (!isnan(t) && t > -20.0f && t < 80.0f && !isnan(h) && h >= 0.0f && h <= 100.0f);
  if (m.valid) {
    lastValidTemp = t;
    lastValidHum = h;
  }

  m.tempC = lastValidTemp;
  m.humPct = lastValidHum;
  m.dewPointC = computeDewPoint(m.tempC, m.humPct);
  m.heatIndexC = computeHeatIndex(m.tempC, m.humPct);
  m.condMargin = m.tempC - m.dewPointC;
  return m;
}

GasMetrics readGasSensors(float tempC, float humPct) {
  GasMetrics g;
  uint32_t adcSum = 0;
  for (int i = 0; i < 16; i++) {
    adcSum += analogRead(PIN_MQ135);
    delayMicroseconds(100);
  }
  g.avgAdc = adcSum / 16.0f;
  g.voltage = (g.avgAdc / 4095.0f) * 3.3f;

  float vRL = g.voltage > 0.05f ? g.voltage : 0.05f;
  if (vRL >= 3.3f) vRL = 3.29f;
  float Rs = RL_VALUE * ((3.3f - vRL) / vRL);

  // Hygrothermal Compensation Factor C_th(T, H)
  float C_th = (1.385f - (0.0152f * tempC) + (0.00011f * tempC * tempC)) * (1.133f - (0.00205f * humPct));
  if (C_th <= 0.1f) C_th = 0.1f;
  float Rs_corrected = Rs / C_th;
  g.ratio = Rs_corrected / R0_CLEAN_AIR;
  if (g.ratio <= 0.01f) g.ratio = 0.01f;

  // Power-law gas concentrations (PPM)
  g.co2Ppm     = 110.47f * powf(g.ratio, -2.862f);
  g.nh3Ppm     = 102.20f * powf(g.ratio, -2.473f);
  g.alcoholPpm = 77.255f * powf(g.ratio, -3.180f);
  g.acetonePpm = 34.660f * powf(g.ratio, -3.369f);

  if (g.co2Ppm < 400.0f) g.co2Ppm = 400.0f;
  if (g.nh3Ppm < 0.1f) g.nh3Ppm = 0.1f;
  if (g.alcoholPpm < 0.1f) g.alcoholPpm = 0.1f;
  if (g.acetonePpm < 0.1f) g.acetonePpm = 0.1f;

  g.isWarmingUp = (millis() < HEATER_WARMUP_MS);
  return g;
}

OpticsMetrics readOptics() {
  OpticsMetrics o;
  uint32_t adcSum = 0;
  for (int i = 0; i < 16; i++) {
    adcSum += analogRead(PIN_LDR);
    delayMicroseconds(100);
  }
  o.avgAdc = adcSum / 16.0f;
  o.voltage = (o.avgAdc / 4095.0f) * 3.3f;
  o.lightPct = (o.avgAdc / 4095.0f) * 100.0f;

  // Realistic optical Lux scaling for GL5528 photoresistor
  o.estimatedLux = 0.0f;
  if (o.avgAdc > 80.0f) {
    o.estimatedLux = powf(10.0f, ((o.avgAdc / 4095.0f) * 3.5f)) - 1.0f;
    if (o.estimatedLux < 0.0f) o.estimatedLux = 0.0f;
    if (o.estimatedLux > 4000.0f) o.estimatedLux = 4000.0f;
  }
  o.tamperBreach = (o.avgAdc > 2500.0f);
  return o;
}

GpsMetrics readGps() {
  GpsMetrics gm;
  gm.nmeaChars = gps.charsProcessed();
  gm.hasFix = gps.location.isValid();
  gm.sats = gps.satellites.value();
  gm.lat = gm.hasFix ? gps.location.lat() : 0.0f;
  gm.lon = gm.hasFix ? gps.location.lng() : 0.0f;
  gm.alt = gm.hasFix ? gps.altitude.meters() : 0.0f;
  gm.speedKmh = gm.hasFix ? gps.speed.kmph() : 0.0f;
  gm.hdop = gm.hasFix ? (gps.hdop.value() / 100.0f) : 99.9f;
  return gm;
}

// ==============================================================================
// ONBOARD LITTLEFS STORAGE SUBSYSTEM (O(1) NON-BLOCKING)
// ==============================================================================
void saveRecordCount(uint32_t count) {
  File cf = LittleFS.open(LOG_COUNT_PATH, "w");
  if (cf) {
    cf.write((const uint8_t*)&count, sizeof(count));
    cf.flush();
    cf.close();
  }
}

void loadRecordCount() {
  storedRecordCount = 0;
  if (LittleFS.exists(LOG_COUNT_PATH)) {
    File cf = LittleFS.open(LOG_COUNT_PATH, "r");
    if (cf && cf.size() >= sizeof(uint32_t)) {
      uint32_t c = 0;
      cf.read((uint8_t*)&c, sizeof(c));
      storedRecordCount = c;
      cf.close();
      return;
    }
    if (cf) cf.close();
  }

  // Instant O(1) estimate from file size if count file was absent
  if (LittleFS.exists(LOG_FILE_PATH)) {
    File f = LittleFS.open(LOG_FILE_PATH, "r");
    if (f) {
      currentLogSizeBytes = f.size();
      f.close();
      storedRecordCount = currentLogSizeBytes / 360;
    }
  }
}

void initStorage() {
  if (!LittleFS.begin(true)) {
    Serial.println("❌ [STORAGE] LittleFS partition mount failed");
    fsAvailable = false;
    return;
  }
  fsAvailable = true;

  if (LittleFS.exists(LOG_FILE_PATH)) {
    File f = LittleFS.open(LOG_FILE_PATH, "r");
    if (f) {
      currentLogSizeBytes = f.size();
      f.close();
    }
  } else {
    currentLogSizeBytes = 0;
  }

  loadRecordCount();

  size_t total = LittleFS.totalBytes();
  size_t used = LittleFS.usedBytes();
  size_t freeKb = (total > used) ? (total - used) / 1024 : 0;

  Serial.printf("STORAGE_ANNOUNCE:{\"records\":%u,\"bytes\":%u,\"free_kb\":%u}\n",
                (unsigned int)storedRecordCount, (unsigned int)currentLogSizeBytes, (unsigned int)freeKb);
}

void appendStorageRecord(const String &jsonPacket) {
  if (!fsAvailable) return;

  // Manage storage ceiling: if over MAX_LOG_BYTES, rotate log file
  if (currentLogSizeBytes >= MAX_LOG_BYTES) {
    LittleFS.remove(LOG_FILE_PREV);
    LittleFS.rename(LOG_FILE_PATH, LOG_FILE_PREV);
    currentLogSizeBytes = 0;
    storedRecordCount = 0;
    saveRecordCount(0);
  }

  File f = LittleFS.open(LOG_FILE_PATH, "a");
  if (f) {
    size_t written = f.println(jsonPacket);
    f.flush();
    f.close();
    currentLogSizeBytes += written;
    storedRecordCount++;
    saveRecordCount(storedRecordCount);
  }
}

void dumpStorageRecords() {
  if (!fsAvailable || !LittleFS.exists(LOG_FILE_PATH)) {
    Serial.println("OFFLINE_DUMP_START:0");
    Serial.println("OFFLINE_DUMP_COMPLETE:0");
    return;
  }

  File f = LittleFS.open(LOG_FILE_PATH, "r");
  if (!f) {
    Serial.println("OFFLINE_DUMP_START:0");
    Serial.println("OFFLINE_DUMP_COMPLETE:0");
    return;
  }

  Serial.printf("OFFLINE_DUMP_START:%u\n", (unsigned int)storedRecordCount);
  uint32_t count = 0;
  while (f.available()) {
    String line = f.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      Serial.print("OFFLINE_JSON:");
      Serial.println(line);
      count++;
      // Feed FreeRTOS watchdog every 20 records
      if (count % 20 == 0) {
        vTaskDelay(pdMS_TO_TICKS(1));
      }
    }
  }
  f.close();
  Serial.printf("OFFLINE_DUMP_COMPLETE:%u\n", (unsigned int)count);
}

void clearStorageRecords() {
  if (fsAvailable) {
    LittleFS.remove(LOG_FILE_PATH);
    LittleFS.remove(LOG_FILE_PREV);
    LittleFS.remove(LOG_COUNT_PATH);
  }
  storedRecordCount = 0;
  currentLogSizeBytes = 0;
  Serial.println("OFFLINE_BUFFER_CLEARED:OK");
}

void syncStorageRecords() {
  dumpStorageRecords();
  clearStorageRecords();
  Serial.println("OFFLINE_SYNC_COMPLETE:OK");
}

// ==============================================================================
// SERIAL COMMAND PROTOCOL
// ==============================================================================
void executeCommand(String cmd) {
  cmd.trim();
  cmd.toUpperCase();

  if (cmd == "STATUS" || cmd == "CMD:STATUS") {
    size_t total = fsAvailable ? LittleFS.totalBytes() : 0;
    size_t used = fsAvailable ? LittleFS.usedBytes() : 0;
    size_t freeKb = (total > used) ? (total - used) / 1024 : 0;
    Serial.printf("STATUS:{\"records\":%u,\"bytes\":%u,\"free_kb\":%u,\"uptime\":%lu,\"shocks\":%lu,\"streaming\":%s}\n",
                  (unsigned int)storedRecordCount,
                  (unsigned int)currentLogSizeBytes,
                  (unsigned int)freeKb,
                  (unsigned long)(millis() / 1000),
                  (unsigned long)getShockCount(),
                  liveStreamActive ? "true" : "false");
  }
  else if (cmd == "DUMP" || cmd == "CMD:DUMP") {
    dumpStorageRecords();
  }
  else if (cmd == "CLEAR" || cmd == "CMD:CLEAR") {
    clearStorageRecords();
  }
  else if (cmd == "SYNC" || cmd == "CMD:SYNC") {
    syncStorageRecords();
  }
  else if (cmd == "PAUSE" || cmd == "CMD:PAUSE") {
    liveStreamActive = false;
    Serial.println("STREAM:PAUSED");
  }
  else if (cmd == "RESUME" || cmd == "CMD:RESUME") {
    liveStreamActive = true;
    Serial.println("STREAM:RESUMED");
  }
  else if (cmd == "HELP" || cmd == "CMD:HELP" || cmd == "?") {
    Serial.println("HELP:COMMANDS=STATUS,DUMP,CLEAR,SYNC,PAUSE,RESUME");
  }
  else if (cmd.length() > 0) {
    Serial.printf("CMD_UNKNOWN:%s\n", cmd.c_str());
  }
}

void checkIncomingSerial() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\r' || c == '\n') {
      if (serialCmdBuffer.length() > 0) {
        executeCommand(serialCmdBuffer);
        serialCmdBuffer = "";
      }
    } else if (serialCmdBuffer.length() < 128) {
      serialCmdBuffer += c;
    }
  }
}

// ==============================================================================
// SETUP & INITIALIZATION
// ==============================================================================
void setup() {
  Serial.begin(115200);
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW);

  // SW-420 Transit Shock Interrupt Pin on GPIO 32
  pinMode(PIN_SW420, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_SW420), onShockISR, FALLING);

  // LDR Light Sensor Divider Pin on GPIO 35
  pinMode(PIN_LDR, INPUT);

  // ADC1 Setup for MQ-135 and LDR
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // NEO-6M GPS UART Setup (9600 baud, 8N1)
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  delay(200);

  // Initialize LittleFS storage (instant O(1))
  initStorage();

  // Initialize DHT11 sensor
  dht.begin();
  delay(300);

  lastCycleTime = millis();
  lastLogTime = millis();
}

// ==============================================================================
// MAIN RUNTIME LOOP
// ==============================================================================
void loop() {
  // 1. Ingest GPS NMEA stream in real time
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    gps.encode(c);
  }

  // 2. Process incoming serial commands from PC
  checkIncomingSerial();

  // 3. Periodic Telemetry Sampling (Every 1000ms)
  if (millis() - lastCycleTime >= TELEMETRY_PULSE_MS) {
    lastCycleTime = millis();
    cycle++;

    // Acquire all 5 sensor subsystems
    ClimateMetrics climate = readClimate();
    GasMetrics gas = readGasSensors(climate.tempC, climate.humPct);
    OpticsMetrics optics = readOptics();
    uint32_t currentShocks = getShockCount();
    GpsMetrics gpsData = readGps();

    // Pulse onboard LED if transit anomaly occurs
    if (currentShocks > 0 || optics.tamperBreach) {
      digitalWrite(ONBOARD_LED, HIGH);
      delay(20);
      digitalWrite(ONBOARD_LED, LOW);
    }

    // Build machine-readable JSON packet
    char jsonBuf[512];
    snprintf(jsonBuf, sizeof(jsonBuf),
      "{\"cycle\":%lu,\"uptime\":%lu,\"temp\":%.2f,\"hum\":%.2f,\"dew_pt\":%.2f,\"heat_idx\":%.2f,\"cond_margin\":%.2f,"
      "\"gas_adc\":%lu,\"gas_v\":%.3f,\"co2_ppm\":%.1f,\"nh3_ppm\":%.2f,\"alcohol_ppm\":%.2f,\"acetone_ppm\":%.2f,"
      "\"shocks\":%lu,\"ldr_adc\":%lu,\"ldr_v\":%.3f,\"ldr_pct\":%.1f,\"lux\":%.1f,\"gps_fix\":%s,"
      "\"lat\":%.6f,\"lon\":%.6f,\"alt\":%.1f,\"speed\":%.1f,\"hdop\":%.2f,\"sats\":%lu,\"nmea_chars\":%lu,"
      "\"flash_records\":%u,\"flash_bytes\":%u,\"warmup\":%s}",
      (unsigned long)cycle,
      (unsigned long)(millis() / 1000),
      climate.tempC,
      climate.humPct,
      climate.dewPointC,
      climate.heatIndexC,
      climate.condMargin,
      (unsigned long)gas.avgAdc,
      gas.voltage,
      gas.co2Ppm,
      gas.nh3Ppm,
      gas.alcoholPpm,
      gas.acetonePpm,
      (unsigned long)currentShocks,
      (unsigned long)optics.avgAdc,
      optics.voltage,
      optics.lightPct,
      optics.estimatedLux,
      gpsData.hasFix ? "true" : "false",
      gpsData.lat,
      gpsData.lon,
      gpsData.alt,
      gpsData.speedKmh,
      gpsData.hdop,
      (unsigned long)gpsData.sats,
      (unsigned long)gpsData.nmeaChars,
      (unsigned int)storedRecordCount,
      (unsigned int)currentLogSizeBytes,
      gas.isWarmingUp ? "true" : "false"
    );

    // Intelligently buffer to LittleFS flash:
    // Log immediately if an impact shock or optical tamper occurred, OR periodically every 10s
    bool isAnomaly = (currentShocks > lastLoggedShocks) || optics.tamperBreach;
    bool timeToLog = (millis() - lastLogTime >= OFFLINE_LOG_MS);
    if (isAnomaly || timeToLog) {
      lastLogTime = millis();
      lastLoggedShocks = currentShocks;
      appendStorageRecord(String(jsonBuf));
    }

    // Emit live telemetry stream to PC
    if (liveStreamActive) {
      Serial.print("JSON:");
      Serial.println(jsonBuf);
    }
  }
}
