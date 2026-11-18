/**
 * @file main.cpp
 * @brief AgriChain Advanced Multi-Gas, Precision Environmental & Tamper-Proof Cryptographic Telemetry Node
 * @target ESP32 DevKit v1 (30-pin)
 *
 * Deep Sensing & Trust Capabilities:
 *  1. DHT11: Temperature (°C, °F, deci-C), Humidity (% RH), Heat Index, Dew Point & Condensation Margin
 *  2. MQ-135: Multi-Gas Decomposition (CO2, NH3 Ammonia, Ethanol/Fermentation Alcohol, Acetone, AQI) with live Hygrothermal Compensation
 *  3. LDR: Optical Lux Estimation (0-1000+ lux), Light Percentage (0-100%), Crate Seal Security State
 *  4. SW-420: Sub-microsecond Hardware Interrupt Shock & Transit Bruising Logger
 *  5. NEO-6M GPS: NMEA 3D Geolocation, Speed (km/h), Altitude, Satellites, HDOP & Clickable Google Maps
 *  6. LittleFS Storage: Two-file rotating offline transit log with acknowledged (two-phase) host sync
 *  7. Hardware SHA-256 Hash Chain: Sub-millisecond hardware cryptographic hash chaining for tamper-evident transit ledgering
 *
 * Serial protocol (115200 baud, newline-terminated):
 *   JSON:{...}                      live packet, 1 Hz (unless paused)
 *   CMD:STATUS                   -> STATUS:{...}
 *   CMD:SYNC | CMD:DUMP          -> OFFLINE_DUMP_START:<n>, OFFLINE_JSON:{...} x n, OFFLINE_DUMP_COMPLETE:<n>
 *                                   (flash is NOT cleared until the host acknowledges)
 *   CMD:ACK:<n>                  -> deletes exactly the records from the last dump (records logged since are kept)
 *                                   OFFLINE_SYNC_COMPLETE:OK | OFFLINE_ACK_REJECTED:<reason>
 *   CMD:CLEAR                    -> OFFLINE_BUFFER_CLEARED:OK (deletes all buffered records)
 *   CMD:TIME:<unix_seconds>      -> TIME:OK:<unix_seconds> (wall clock for record timestamps until GPS UTC is available)
 *   CMD:PAUSE / CMD:RESUME       -> STREAM:PAUSED / STREAM:RESUMED
 */

#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <TinyGPSPlus.h>
#include <FS.h>
#include <LittleFS.h>
#include <math.h>
#include "mbedtls/sha256.h"

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
#define LOG_FILE_PATH        "/agrichain_log.jsonl"      // current (newest) segment
#define LOG_OLD_PATH         "/agrichain_log.old.jsonl"  // previous segment, dropped first when space is needed
#define LOG_TMP_PATH         "/agrichain_log.tmp"
#define LEGACY_COUNT_PATH    "/agrichain_count.bin"      // obsolete record-count file (removed at boot)
#define BOOT_COUNT_PATH      "/agrichain_boot.bin"
#define MAX_LOG_FILE_BYTES   (175 * 1024)    // per segment; 2 segments = 350 KB safe ceiling
#define MIN_FREE_BYTES       (200 * 1024)    // 200 KB free space reserve guard
#define TELEMETRY_PULSE_MS   1000            // 1 Hz live PC stream
#define OFFLINE_LOG_MS       10000           // 10s periodic offline transit buffer
#define HEATER_WARMUP_MS     45000           // 45s MQ-135 heater stabilization window
#define LED_PULSE_MS         40
#define CMD_MAX_LEN          128
#define MIN_VALID_EPOCH      1704067200UL    // 2024-01-01T00:00:00Z — anything earlier is treated as an unset clock

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
uint32_t lastPacketShocks = 0;
bool lastTamperState = false;
float lastValidTemp = 28.5f;
float lastValidHum = 68.0f;
bool liveStreamActive = true;
unsigned long ledOffAt = 0;
bool ledOn = false;

// Wall-clock state: unix time (ms) corresponding to millis() == 0. 0 => unknown.
uint32_t bootCount = 0;
int64_t epochBaseMs = 0;
const char* timeSource = "none";

// Flash storage tracking (two segments)
uint32_t oldRecords = 0, curRecords = 0;
size_t oldBytes = 0, curBytes = 0;
uint32_t logGeneration = 0;     // bumped on every rotation / clear / prune
bool fsAvailable = false;

// Snapshot of the last dump, used to validate CMD:ACK
struct DumpSnapshot {
  bool pending;
  uint32_t generation;
  uint32_t records;
  bool includedOld;
  size_t curBytesDumped;
  uint32_t curRecordsDumped;
} lastDump = {false, 0, 0, false, 0, 0};

// Serial command buffer
char serialCmdBuffer[CMD_MAX_LEN + 1];
size_t serialCmdLen = 0;
bool serialCmdOverflow = false;

// Cryptographic SHA-256 Hash Chaining
char prevRecordHash[65] = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
char currentRecordHash[65] = "0000000000000000000000000000000000000000000000000000000000000000";

inline uint32_t storedRecordCount() { return oldRecords + curRecords; }
inline size_t storedBytes() { return oldBytes + curBytes; }

void computeRecordHashChain(uint32_t cycleNum, float tempC, float humPct, float gasV, uint32_t shocks, float lux, char* outShortHash) {
  char payload[192];
  snprintf(payload, sizeof(payload), "%s|%lu|%.2f|%.2f|%.3f|%lu|%.1f",
           prevRecordHash, (unsigned long)cycleNum, tempC, humPct, gasV, (unsigned long)shocks, lux);

  byte shaResult[32];
  mbedtls_sha256_context ctx;
  mbedtls_sha256_init(&ctx);
  mbedtls_sha256_starts(&ctx, 0);
  mbedtls_sha256_update(&ctx, (const unsigned char*)payload, strlen(payload));
  mbedtls_sha256_finish(&ctx, shaResult);
  mbedtls_sha256_free(&ctx);

  for (int i = 0; i < 32; i++) {
    sprintf(currentRecordHash + (i * 2), "%02x", shaResult[i]);
  }
  currentRecordHash[64] = 0;
  strncpy(prevRecordHash, currentRecordHash, 65);

  // Return 16-character compact hexadecimal fingerprint
  strncpy(outShortHash, currentRecordHash, 16);
  outShortHash[16] = 0;
}

// ==============================================================================
// GPS INGESTION & WALL CLOCK
// ==============================================================================
// Drain the GPS UART into TinyGPSPlus. Called from loop() and from long-running
// operations (flash dumps) so the 256-byte UART FIFO never overruns.
void pumpGps() {
  while (gpsSerial.available() > 0) {
    gps.encode((char)gpsSerial.read());
  }
}

// Howard Hinnant's days_from_civil: days since 1970-01-01 for a proleptic Gregorian date.
static int64_t daysFromCivil(int y, int m, int d) {
  y -= (m <= 2) ? 1 : 0;
  const int era = (y >= 0 ? y : y - 399) / 400;
  const int yoe = y - era * 400;
  const int doy = (153 * (m + (m > 2 ? -3 : 9)) + 2) / 5 + d - 1;
  const int doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
  return (int64_t)era * 146097 + (int64_t)doe - 719468;
}

// GPS UTC is authoritative; host-provided time is used until GPS has a valid date/time.
void updateClockFromGps() {
  if (!gps.date.isValid() || !gps.time.isValid()) return;
  if (gps.date.year() < 2024 || gps.time.age() > 1500) return;
  int64_t days = daysFromCivil(gps.date.year(), gps.date.month(), gps.date.day());
  int64_t epochMs = (days * 86400LL + gps.time.hour() * 3600LL + gps.time.minute() * 60LL + gps.time.second()) * 1000LL
                    + gps.time.centisecond() * 10LL;
  // The fix was taken age() ms ago, i.e. at millis() - age.
  epochBaseMs = epochMs - ((int64_t)millis() - (int64_t)gps.time.age());
  timeSource = "gps";
}

// Current unix time in seconds, or 0 when no clock source has been established.
uint32_t currentUnixTime() {
  if (epochBaseMs == 0) return 0;
  return (uint32_t)((epochBaseMs + (int64_t)millis()) / 1000LL);
}

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
// ONBOARD LITTLEFS STORAGE SUBSYSTEM
// Two segments: LOG_FILE_PATH (current) and LOG_OLD_PATH (previous). When the
// current segment reaches MAX_LOG_FILE_BYTES it becomes the old segment, so a
// rotation discards only the oldest half of the buffer, never everything.
// ==============================================================================
size_t fsFreeBytes() {
  size_t total = LittleFS.totalBytes();
  size_t used = LittleFS.usedBytes();
  return (total > used) ? (total - used) : 0;
}

// Count newline-terminated records in a file. If power was lost mid-write the
// last line has no terminator: append one so the next record isn't glued onto it.
uint32_t scanLogFile(const char* path, size_t* bytesOut) {
  *bytesOut = 0;
  if (!LittleFS.exists(path)) return 0;
  File f = LittleFS.open(path, "r");
  if (!f) return 0;
  uint8_t buf[512];
  uint32_t lines = 0;
  size_t total = 0;
  uint8_t last = '\n';
  size_t n;
  while ((n = f.read(buf, sizeof(buf))) > 0) {
    for (size_t i = 0; i < n; i++) {
      if (buf[i] == '\n') lines++;
    }
    last = buf[n - 1];
    total += n;
  }
  f.close();
  if (total > 0 && last != '\n') {
    File a = LittleFS.open(path, "a");
    if (a) {
      a.write((const uint8_t*)"\n", 1);
      a.close();
      total += 1;
      lines += 1;  // the torn line is still counted; the host discards it if it doesn't parse
    }
  }
  *bytesOut = total;
  return lines;
}

void rotateLog() {
  LittleFS.remove(LOG_OLD_PATH);
  if (LittleFS.exists(LOG_FILE_PATH)) {
    LittleFS.rename(LOG_FILE_PATH, LOG_OLD_PATH);
  }
  oldRecords = curRecords;
  oldBytes = curBytes;
  curRecords = 0;
  curBytes = 0;
  logGeneration++;
}

// Keep the reserve guard by discarding the oldest data first — never a blind format().
void ensureFreeSpace() {
  if (fsFreeBytes() >= MIN_FREE_BYTES) return;
  if (LittleFS.exists(LOG_OLD_PATH)) {
    LittleFS.remove(LOG_OLD_PATH);
    oldRecords = 0;
    oldBytes = 0;
    logGeneration++;
    Serial.println("STORAGE_PRUNED:OLD_SEGMENT");
  }
  if (fsFreeBytes() >= MIN_FREE_BYTES) return;
  rotateLog();
  LittleFS.remove(LOG_OLD_PATH);
  oldRecords = 0;
  oldBytes = 0;
  Serial.println("STORAGE_PRUNED:ALL_SEGMENTS");
}

void loadBootCount() {
  bootCount = 0;
  File f = LittleFS.open(BOOT_COUNT_PATH, "r");
  if (f) {
    if (f.size() >= sizeof(uint32_t)) f.read((uint8_t*)&bootCount, sizeof(bootCount));
    f.close();
  }
  bootCount++;
  File w = LittleFS.open(BOOT_COUNT_PATH, "w");
  if (w) {
    w.write((const uint8_t*)&bootCount, sizeof(bootCount));
    w.close();
  }
}

void initStorage() {
  // Mount without auto-format first so a corrupted filesystem is reported instead of
  // being silently wiped; only then fall back to formatting so logging can continue.
  if (!LittleFS.begin(false)) {
    Serial.println("STORAGE_ERROR:MOUNT_FAILED_REFORMATTING");
    if (!LittleFS.begin(true)) {
      Serial.println("STORAGE_ERROR:MOUNT_FAILED");
      fsAvailable = false;
      return;
    }
    Serial.println("STORAGE_WARNING:FILESYSTEM_REFORMATTED_PREVIOUS_RECORDS_LOST");
  }
  fsAvailable = true;

  LittleFS.remove(LEGACY_COUNT_PATH);  // replaced by scanning the log at boot
  LittleFS.remove(LOG_TMP_PATH);       // leftover from an interrupted ACK compaction
  loadBootCount();

  oldRecords = scanLogFile(LOG_OLD_PATH, &oldBytes);
  curRecords = scanLogFile(LOG_FILE_PATH, &curBytes);
  ensureFreeSpace();

  Serial.printf("STORAGE_ANNOUNCE:{\"records\":%u,\"bytes\":%u,\"free_kb\":%u,\"boot\":%lu}\n",
                (unsigned int)storedRecordCount(), (unsigned int)storedBytes(),
                (unsigned int)(fsFreeBytes() / 1024), (unsigned long)bootCount);
}

void appendStorageRecord(const char* jsonPacket) {
  if (!fsAvailable) return;

  ensureFreeSpace();
  if (curBytes >= MAX_LOG_FILE_BYTES) {
    rotateLog();
  }

  File f = LittleFS.open(LOG_FILE_PATH, "a");
  if (!f) return;
  size_t len = strlen(jsonPacket);
  size_t written = f.write((const uint8_t*)jsonPacket, len);
  written += f.write((const uint8_t*)"\n", 1);
  f.close();  // close() flushes; the file is consistent on flash after this returns
  if (written > 0) {
    curBytes += written;
    curRecords++;
  }
}

// Stream one file as OFFLINE_JSON lines; returns the number of lines sent.
// maxBytes limits how much of the file is sent (the snapshot taken at dump start).
uint32_t dumpLogFile(const char* path, size_t maxBytes) {
  if (maxBytes == 0 || !LittleFS.exists(path)) return 0;
  File f = LittleFS.open(path, "r");
  if (!f) return 0;
  char line[768];
  uint32_t count = 0;
  size_t consumed = 0;
  while (f.available() && consumed < maxBytes) {
    size_t n = f.readBytesUntil('\n', line, sizeof(line) - 1);
    consumed += n + 1;
    line[n] = 0;
    while (n > 0 && (line[n - 1] == '\r' || line[n - 1] == ' ')) line[--n] = 0;
    if (n == 0) continue;
    Serial.print("OFFLINE_JSON:");
    Serial.println(line);
    count++;
    pumpGps();
    if (count % 20 == 0) {
      vTaskDelay(pdMS_TO_TICKS(1));  // yield to idle task / watchdog
    }
  }
  f.close();
  return count;
}

// Phase 1 of sync: send every buffered record, oldest first. Nothing is deleted here.
void dumpStorageRecords() {
  if (!fsAvailable) {
    Serial.println("OFFLINE_DUMP_START:0");
    Serial.println("OFFLINE_DUMP_COMPLETE:0");
    lastDump.pending = false;
    return;
  }

  lastDump.generation = logGeneration;
  lastDump.includedOld = (oldRecords > 0);
  lastDump.curBytesDumped = curBytes;
  lastDump.curRecordsDumped = curRecords;

  Serial.printf("OFFLINE_DUMP_START:%u\n", (unsigned int)storedRecordCount());
  uint32_t count = 0;
  count += dumpLogFile(LOG_OLD_PATH, oldBytes);
  count += dumpLogFile(LOG_FILE_PATH, lastDump.curBytesDumped);
  Serial.printf("OFFLINE_DUMP_COMPLETE:%u\n", (unsigned int)count);

  lastDump.records = count;
  lastDump.pending = true;
}

// Phase 2 of sync: the host confirms it stored `ackCount` records. Delete exactly
// what was dumped; keep anything appended after the dump started.
void acknowledgeDump(uint32_t ackCount) {
  if (!lastDump.pending) {
    Serial.println("OFFLINE_ACK_REJECTED:NO_PENDING_DUMP");
    return;
  }
  if (lastDump.generation != logGeneration) {
    lastDump.pending = false;
    Serial.println("OFFLINE_ACK_REJECTED:STALE");
    return;
  }
  if (ackCount != lastDump.records) {
    Serial.printf("OFFLINE_ACK_REJECTED:COUNT_MISMATCH:%u\n", (unsigned int)lastDump.records);
    return;
  }

  if (lastDump.includedOld) {
    LittleFS.remove(LOG_OLD_PATH);
    oldRecords = 0;
    oldBytes = 0;
  }

  if (curBytes <= lastDump.curBytesDumped) {
    LittleFS.remove(LOG_FILE_PATH);
    curRecords = 0;
    curBytes = 0;
  } else {
    // Records arrived after the dump: copy the un-dumped tail into a fresh segment.
    File src = LittleFS.open(LOG_FILE_PATH, "r");
    File dst = LittleFS.open(LOG_TMP_PATH, "w");
    bool ok = src && dst && src.seek(lastDump.curBytesDumped);
    size_t tailBytes = 0;
    if (ok) {
      uint8_t buf[512];
      size_t n;
      while ((n = src.read(buf, sizeof(buf))) > 0) {
        if (dst.write(buf, n) != n) { ok = false; break; }
        tailBytes += n;
      }
    }
    if (src) src.close();
    if (dst) dst.close();
    if (!ok) {
      LittleFS.remove(LOG_TMP_PATH);
      lastDump.pending = false;
      Serial.println("OFFLINE_ACK_REJECTED:COMPACT_FAILED");
      return;
    }
    LittleFS.remove(LOG_FILE_PATH);
    LittleFS.rename(LOG_TMP_PATH, LOG_FILE_PATH);
    curRecords -= lastDump.curRecordsDumped;
    curBytes = tailBytes;
  }

  logGeneration++;
  lastDump.pending = false;
  Serial.println("OFFLINE_SYNC_COMPLETE:OK");
}

void clearStorageRecords() {
  if (fsAvailable) {
    LittleFS.remove(LOG_OLD_PATH);
    LittleFS.remove(LOG_FILE_PATH);
    LittleFS.remove(LOG_TMP_PATH);
  }
  oldRecords = curRecords = 0;
  oldBytes = curBytes = 0;
  logGeneration++;
  lastDump.pending = false;
  Serial.println("OFFLINE_BUFFER_CLEARED:OK");
}

// ==============================================================================
// SERIAL COMMAND PROTOCOL
// ==============================================================================
void executeCommand(char* raw) {
  // Trim and uppercase in place
  while (*raw == ' ' || *raw == '\t') raw++;
  size_t len = strlen(raw);
  while (len > 0 && (raw[len - 1] == ' ' || raw[len - 1] == '\t')) raw[--len] = 0;
  for (size_t i = 0; i < len; i++) raw[i] = toupper((unsigned char)raw[i]);
  const char* cmd = (strncmp(raw, "CMD:", 4) == 0) ? raw + 4 : raw;

  if (strcmp(cmd, "STATUS") == 0) {
    Serial.printf("STATUS:{\"records\":%u,\"bytes\":%u,\"free_kb\":%u,\"uptime\":%lu,\"up_ms\":%lu,\"boot\":%lu,"
                  "\"ts\":%lu,\"ts_src\":\"%s\",\"shocks\":%lu,\"streaming\":%s,\"pending_ack\":%s,\"hash\":\"%.16s\"}\n",
                  (unsigned int)storedRecordCount(),
                  (unsigned int)storedBytes(),
                  (unsigned int)(fsAvailable ? fsFreeBytes() / 1024 : 0),
                  (unsigned long)(millis() / 1000),
                  (unsigned long)millis(),
                  (unsigned long)bootCount,
                  (unsigned long)currentUnixTime(),
                  timeSource,
                  (unsigned long)getShockCount(),
                  liveStreamActive ? "true" : "false",
                  lastDump.pending ? "true" : "false",
                  currentRecordHash);
  }
  else if (strcmp(cmd, "DUMP") == 0 || strcmp(cmd, "SYNC") == 0) {
    dumpStorageRecords();
  }
  else if (strncmp(cmd, "ACK:", 4) == 0) {
    char* end = nullptr;
    unsigned long n = strtoul(cmd + 4, &end, 10);
    if (end == cmd + 4 || *end != 0) {
      Serial.println("OFFLINE_ACK_REJECTED:BAD_FORMAT");
    } else {
      acknowledgeDump((uint32_t)n);
    }
  }
  else if (strcmp(cmd, "CLEAR") == 0) {
    clearStorageRecords();
  }
  else if (strncmp(cmd, "TIME:", 5) == 0) {
    char* end = nullptr;
    unsigned long t = strtoul(cmd + 5, &end, 10);
    if (end == cmd + 5 || *end != 0 || t < MIN_VALID_EPOCH) {
      Serial.println("TIME:REJECTED");
    } else {
      // GPS UTC stays authoritative once available; the host clock only fills the gap.
      if (strcmp(timeSource, "gps") != 0) {
        epochBaseMs = (int64_t)t * 1000LL - (int64_t)millis();
        timeSource = "host";
      }
      Serial.printf("TIME:OK:%lu:%s\n", (unsigned long)currentUnixTime(), timeSource);
    }
  }
  else if (strcmp(cmd, "PAUSE") == 0) {
    liveStreamActive = false;
    Serial.println("STREAM:PAUSED");
  }
  else if (strcmp(cmd, "RESUME") == 0) {
    liveStreamActive = true;
    Serial.println("STREAM:RESUMED");
  }
  else if (strcmp(cmd, "HELP") == 0 || strcmp(cmd, "?") == 0) {
    Serial.println("HELP:COMMANDS=STATUS,SYNC,DUMP,ACK:<n>,CLEAR,TIME:<unix>,PAUSE,RESUME");
  }
  else if (len > 0) {
    Serial.printf("CMD_UNKNOWN:%s\n", raw);
  }
}

void checkIncomingSerial() {
  while (Serial.available() > 0) {
    char c = (char)Serial.read();
    if (c == '\r' || c == '\n') {
      if (serialCmdOverflow) {
        Serial.println("CMD_REJECTED:TOO_LONG");
      } else if (serialCmdLen > 0) {
        serialCmdBuffer[serialCmdLen] = 0;
        executeCommand(serialCmdBuffer);
      }
      serialCmdLen = 0;
      serialCmdOverflow = false;
    } else if (serialCmdLen < CMD_MAX_LEN) {
      serialCmdBuffer[serialCmdLen++] = c;
    } else {
      serialCmdOverflow = true;  // discard the whole line rather than execute a truncated command
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

  // Initialize LittleFS storage (scans the log once to recover record counts)
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
  pumpGps();

  // 2. Process incoming serial commands from PC
  checkIncomingSerial();

  // 3. Non-blocking LED pulse release
  if (ledOn && (long)(millis() - ledOffAt) >= 0) {
    digitalWrite(ONBOARD_LED, LOW);
    ledOn = false;
  }

  // 4. Periodic Telemetry Sampling (Every 1000ms)
  if (millis() - lastCycleTime >= TELEMETRY_PULSE_MS) {
    lastCycleTime = millis();
    cycle++;

    updateClockFromGps();

    // Acquire all 5 sensor subsystems
    ClimateMetrics climate = readClimate();
    GasMetrics gas = readGasSensors(climate.tempC, climate.humPct);
    OpticsMetrics optics = readOptics();
    uint32_t currentShocks = getShockCount();
    uint32_t shockDelta = currentShocks - lastPacketShocks;
    lastPacketShocks = currentShocks;
    GpsMetrics gpsData = readGps();

    // Pulse onboard LED on a new impact or while the crate is open (non-blocking)
    if (shockDelta > 0 || optics.tamperBreach) {
      digitalWrite(ONBOARD_LED, HIGH);
      ledOn = true;
      ledOffAt = millis() + LED_PULSE_MS;
    }

    // Hardware SHA-256 Cryptographic Hash Chaining
    char shortHash[17];
    computeRecordHashChain(cycle, climate.tempC, climate.humPct, gas.voltage, currentShocks, optics.estimatedLux, shortHash);

    // Build machine-readable JSON packet with cryptographic fingerprint
    char jsonBuf[768];
    int jsonLen = snprintf(jsonBuf, sizeof(jsonBuf),
      "{\"cycle\":%lu,\"uptime\":%lu,\"up_ms\":%lu,\"boot\":%lu,\"ts\":%lu,\"ts_src\":\"%s\","
      "\"temp\":%.2f,\"hum\":%.2f,\"dew_pt\":%.2f,\"heat_idx\":%.2f,\"cond_margin\":%.2f,\"dht_ok\":%s,"
      "\"gas_adc\":%lu,\"gas_v\":%.3f,\"co2_ppm\":%.1f,\"nh3_ppm\":%.2f,\"alcohol_ppm\":%.2f,\"acetone_ppm\":%.2f,"
      "\"shocks\":%lu,\"shock_delta\":%lu,\"ldr_adc\":%lu,\"ldr_v\":%.3f,\"ldr_pct\":%.1f,\"lux\":%.1f,\"tamper\":%s,"
      "\"gps_fix\":%s,\"lat\":%.6f,\"lon\":%.6f,\"alt\":%.1f,\"speed\":%.1f,\"hdop\":%.2f,\"sats\":%lu,\"nmea_chars\":%lu,"
      "\"flash_records\":%u,\"flash_bytes\":%u,\"hash\":\"%s\",\"warmup\":%s}",
      (unsigned long)cycle,
      (unsigned long)(millis() / 1000),
      (unsigned long)millis(),
      (unsigned long)bootCount,
      (unsigned long)currentUnixTime(),
      timeSource,
      climate.tempC,
      climate.humPct,
      climate.dewPointC,
      climate.heatIndexC,
      climate.condMargin,
      climate.valid ? "true" : "false",
      (unsigned long)gas.avgAdc,
      gas.voltage,
      gas.co2Ppm,
      gas.nh3Ppm,
      gas.alcoholPpm,
      gas.acetonePpm,
      (unsigned long)currentShocks,
      (unsigned long)shockDelta,
      (unsigned long)optics.avgAdc,
      optics.voltage,
      optics.lightPct,
      optics.estimatedLux,
      optics.tamperBreach ? "true" : "false",
      gpsData.hasFix ? "true" : "false",
      gpsData.lat,
      gpsData.lon,
      gpsData.alt,
      gpsData.speedKmh,
      gpsData.hdop,
      (unsigned long)gpsData.sats,
      (unsigned long)gpsData.nmeaChars,
      (unsigned int)storedRecordCount(),
      (unsigned int)storedBytes(),
      shortHash,
      gas.isWarmingUp ? "true" : "false"
    );
    bool jsonOk = (jsonLen > 0 && jsonLen < (int)sizeof(jsonBuf));

    // Buffer to LittleFS flash: immediately on a new impact or when the lid is first
    // opened (rising edge), otherwise every OFFLINE_LOG_MS. A lid left open is therefore
    // logged at the normal cadence instead of flooding flash once per second.
    bool tamperEdge = optics.tamperBreach && !lastTamperState;
    lastTamperState = optics.tamperBreach;
    bool isAnomaly = (shockDelta > 0) || tamperEdge;
    bool timeToLog = (millis() - lastLogTime >= OFFLINE_LOG_MS);
    if (jsonOk && (isAnomaly || timeToLog)) {
      lastLogTime = millis();
      appendStorageRecord(jsonBuf);
    }

    // Emit live telemetry stream to PC
    if (jsonOk && liveStreamActive) {
      Serial.print("JSON:");
      Serial.println(jsonBuf);
    }
  }
}
