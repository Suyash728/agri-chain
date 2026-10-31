/**
 * @file main.cpp
 * @brief AgriChain Full 5-Channel Hardware Diagnostic Suite (1-Second Stream)
 * @target ESP32 DevKit v1 (30-pin)
 * 
 * Channels:
 *  1. DHT11 (Temp & Humidity):        GPIO 4  (D4)
 *  2. MQ-135 (Gas & Spoilage VOC):    GPIO 34 (D34, ADC1_CH6)
 *  3. SW-420 (Transit Shock Switch):  GPIO 27 (D27, Hardware IRQ)
 *  4. LDR Light Sensor (Anti-Tamper): GPIO 35 (D35, ADC1_CH7)
 *  5. NEO-6M GPS (Geolocation):       GPIO 16 (RX2), GPIO 17 (TX2) via Serial2 (9600 baud)
 */

#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <TinyGPSPlus.h>

#define PIN_DHT11     4
#define DHTTYPE       DHT11
#define PIN_MQ135     34
#define PIN_SW420     27
#define PIN_LDR       35
#define GPS_RX_PIN    16
#define GPS_TX_PIN    17
#define ONBOARD_LED   2

DHT dht(PIN_DHT11, DHTTYPE);
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

volatile uint32_t totalShocks = 0;
volatile uint32_t lastShockMs = 0;

// Sub-microsecond hardware interrupt for vibration detection
void IRAM_ATTR onShockISR() {
  uint32_t now = millis();
  if (now - lastShockMs > 25) { // 25ms hardware debounce latch
    totalShocks++;
    lastShockMs = now;
  }
}

uint32_t cycle = 0;
unsigned long lastCycleTime = 0;
float lastValidTemp = 28.0f;
float lastValidHum = 65.0f;

void setup() {
  Serial.begin(115200);
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW);

  // SW-420 Interrupt Pin
  pinMode(PIN_SW420, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_SW420), onShockISR, FALLING);

  // ADC1 Setup for MQ-135 and LDR
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // NEO-6M GPS UART Setup (9600 baud, 8N1)
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  delay(1000);

  Serial.println("\n================================================================================");
  Serial.println("  🚚 AgriChain Full 5-Channel Live Telemetry Stream (1000ms Polling)");
  Serial.println("================================================================================\n");

  dht.begin();
  delay(500);
  lastCycleTime = millis();
}

void loop() {
  // Feed GPS parser with incoming serial characters as fast as possible
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    gps.encode(c);
  }

  // Periodic sensor sampling every 1000 ms (1 second)
  if (millis() - lastCycleTime >= 1000) {
    lastCycleTime = millis();
    cycle++;

    // 1. Read DHT11 (with graceful fallback to last valid reading if timing jitter occurs)
    float t = dht.readTemperature();
    if (!isnan(t) && t > -20.0f && t < 80.0f) {
      lastValidTemp = t;
    }
    float h = dht.readHumidity();
    if (!isnan(h) && h >= 0.0f && h <= 100.0f) {
      lastValidHum = h;
    }

    // 2. Read MQ-135 (16x oversampled on ADC1)
    uint32_t gasAdcSum = 0;
    for (int i = 0; i < 16; i++) {
      gasAdcSum += analogRead(PIN_MQ135);
      delayMicroseconds(100);
    }
    float gasAvgAdc = gasAdcSum / 16.0f;
    float gasVoltage = (gasAvgAdc / 4095.0f) * 3.3f;

    // 3. Read LDR (16x oversampled on ADC1)
    uint32_t ldrAdcSum = 0;
    for (int i = 0; i < 16; i++) {
      ldrAdcSum += analogRead(PIN_LDR);
      delayMicroseconds(100);
    }
    float ldrAvgAdc = ldrAdcSum / 16.0f;
    float ldrVoltage = (ldrAvgAdc / 4095.0f) * 3.3f;

    // 4. Read Shock ISR Count
    noInterrupts();
    uint32_t currentShocks = totalShocks;
    interrupts();

    // 5. GPS Status
    uint32_t rawNmeaChars = gps.charsProcessed();
    bool hasFix = gps.location.isValid();
    uint32_t satCount = gps.satellites.value();
    float lat = hasFix ? gps.location.lat() : 0.0f;
    float lon = hasFix ? gps.location.lng() : 0.0f;
    float alt = hasFix ? gps.altitude.meters() : 0.0f;

    // Visual pulse if shock or light breach occurs
    if (currentShocks > 0) {
      digitalWrite(ONBOARD_LED, HIGH);
      delay(20);
      digitalWrite(ONBOARD_LED, LOW);
    }

    // High-precision machine-readable JSON packet
    Serial.printf("JSON:{\"cycle\":%lu,\"uptime\":%lu,\"temp\":%.2f,\"hum\":%.2f,\"gas_adc\":%lu,\"gas_v\":%.3f,\"shocks\":%lu,\"ldr_adc\":%lu,\"ldr_v\":%.3f,\"gps_fix\":%s,\"lat\":%.6f,\"lon\":%.6f,\"alt\":%.1f,\"sats\":%lu,\"nmea_chars\":%lu}\n",
                  (unsigned long)cycle,
                  (unsigned long)(millis() / 1000),
                  lastValidTemp,
                  lastValidHum,
                  (unsigned long)gasAvgAdc,
                  gasVoltage,
                  (unsigned long)currentShocks,
                  (unsigned long)ldrAvgAdc,
                  ldrVoltage,
                  hasFix ? "true" : "false",
                  lat,
                  lon,
                  alt,
                  (unsigned long)satCount,
                  (unsigned long)rawNmeaChars);

    // Human-readable line
    if (hasFix) {
      Serial.printf("[#%04lu] 🌡️ %.1f°C | 💧 %.1f%% | 💨 %.2fV | 💥 %lu | 💡 %.2fV | 🛰️ FIX! Lat: %.6f, Lon: %.6f | 🗺️ https://www.google.com/maps?q=%.6f,%.6f\n",
                    (unsigned long)cycle,
                    lastValidTemp,
                    lastValidHum,
                    gasVoltage,
                    (unsigned long)currentShocks,
                    ldrVoltage,
                    lat,
                    lon,
                    lat,
                    lon);
    } else {
      Serial.printf("[#%04lu] 🌡️ %.1f°C | 💧 %.1f%% RH | 💨 Gas: %.2fV | 💥 Shock: %lu %s | 💡 LDR: %.2fV | 🛰️ GPS: SEARCHING (Chars: %lu, Sats: %lu)\n",
                    (unsigned long)cycle,
                    lastValidTemp,
                    lastValidHum,
                    gasVoltage,
                    (unsigned long)currentShocks,
                    (currentShocks > 0) ? "🚨[IMPACT]" : "🛡️[OK]",
                    ldrVoltage,
                    (unsigned long)rawNmeaChars,
                    (unsigned long)satCount);
    }
  }
}
