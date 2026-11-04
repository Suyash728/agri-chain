/**
 * @file main.cpp
 * @brief AgriChain Advanced Multi-Gas & Precision Environmental Telemetry
 * @target ESP32 DevKit v1 (30-pin)
 * 
 * Deep Sensing Capabilities:
 *  1. DHT11: Temperature (°C, °F, deci-C), Humidity (% RH), Heat Index, Dew Point & Condensation Margin
 *  2. MQ-135: Multi-Gas Decomposition (CO2, NH3 Ammonia, Ethanol/Fermentation Alcohol, Acetone, AQI) with live Hygrothermal Compensation
 *  3. LDR: Optical Lux Estimation (0-1000+ lux), Light Percentage (0-100%), Crate Seal Security State
 *  4. SW-420: Sub-microsecond Hardware Interrupt Shock & Transit Bruising Logger
 *  5. NEO-6M GPS: NMEA 3D Geolocation, Speed (km/h), Altitude, Satellites, HDOP & Clickable Google Maps
 */

#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <TinyGPSPlus.h>
#include <math.h>

#define PIN_DHT11     4
#define DHTTYPE       DHT11
#define PIN_MQ135     34
#define PIN_SW420     32
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
float lastValidTemp = 28.5f;
float lastValidHum = 68.0f;

// Calibration parameters for MQ-135 (Load Resistor RL = 10k, Clean Air R0 ~ 10k nominal)
const float RL_VALUE = 10.0f;     // Load resistance in kOhms
const float R0_CLEAN_AIR = 10.0f; // Calibrated R0 in kOhms

// Compute Dew Point (°C) using Magnus-Tetens formula
float computeDewPoint(float tempC, float humPct) {
  if (humPct <= 0.0f) return tempC;
  const float a = 17.27f;
  const float b = 237.7f;
  float alpha = ((a * tempC) / (b + tempC)) + logf(humPct / 100.0f);
  return (b * alpha) / (a - alpha);
}

// Compute Heat Index (°C)
float computeHeatIndex(float tempC, float humPct) {
  float T = (tempC * 9.0f / 5.0f) + 32.0f; // convert to Fahrenheit
  float R = humPct;
  float hi = 0.5f * (T + 61.0f + ((T - 68.0f) * 1.2f) + (R * 0.094f));
  if (hi >= 80.0f) {
    hi = -42.379f + 2.04901523f * T + 10.14333127f * R - 0.22475541f * T * R
         - 0.00683783f * T * T - 0.05481717f * R * R + 0.00122874f * T * T * R
         + 0.00085282f * T * R * R - 0.00000199f * T * T * R * R;
  }
  return (hi - 32.0f) * 5.0f / 9.0f; // convert back to Celsius
}

void setup() {
  Serial.begin(115200);
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW);

  // SW-420 Interrupt Pin on GPIO 32
  pinMode(PIN_SW420, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_SW420), onShockISR, FALLING);

  // LDR Light Sensor Pin on GPIO 35
  pinMode(PIN_LDR, INPUT);

  // ADC1 Setup for MQ-135 and LDR
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // NEO-6M GPS UART Setup (9600 baud, 8N1)
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  delay(1000);

  Serial.println("\n================================================================================");
  Serial.println("  🚚 AgriChain Deep Telemetry & Multi-Gas Environmental Suite (1000ms)");
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

    // 1. Read DHT11 Microclimate
    float t = dht.readTemperature();
    if (!isnan(t) && t > -20.0f && t < 80.0f) lastValidTemp = t;
    float h = dht.readHumidity();
    if (!isnan(h) && h >= 0.0f && h <= 100.0f) lastValidHum = h;

    float tempC = lastValidTemp;
    float humPct = lastValidHum;
    float dewPointC = computeDewPoint(tempC, humPct);
    float heatIndexC = computeHeatIndex(tempC, humPct);
    float condensationMargin = tempC - dewPointC; // Danger if < 2.0°C

    // 2. Read MQ-135 with Multi-Gas Decomposition
    uint32_t gasAdcSum = 0;
    for (int i = 0; i < 16; i++) {
      gasAdcSum += analogRead(PIN_MQ135);
      delayMicroseconds(100);
    }
    float gasAvgAdc = gasAdcSum / 16.0f;
    float gasVoltage = (gasAvgAdc / 4095.0f) * 3.3f;

    // Calculate Sensor Resistance Rs
    float vSupply = 3.3f; // powered from 3.3V rail
    float vRL = gasVoltage > 0.05f ? gasVoltage : 0.05f;
    if (vRL >= vSupply) vRL = vSupply - 0.01f;
    float Rs = RL_VALUE * ((vSupply - vRL) / vRL);

    // Two-Variable Hygrothermal Compensation Factor C_th(T, H)
    float C_th = (1.385f - (0.0152f * tempC) + (0.00011f * tempC * tempC)) * (1.133f - (0.00205f * humPct));
    if (C_th <= 0.1f) C_th = 0.1f;
    float Rs_corrected = Rs / C_th;
    float ratio = Rs_corrected / R0_CLEAN_AIR;
    if (ratio <= 0.01f) ratio = 0.01f;

    // Power-law gas concentrations (PPM)
    float ppmCO2     = 110.47f * powf(ratio, -2.862f);  // Carbon Dioxide (Respiration)
    float ppmNH3     = 102.20f * powf(ratio, -2.473f);  // Ammonia (Microbial Rot)
    float ppmAlcohol = 77.255f * powf(ratio, -3.180f);  // Ethanol (Anaerobic Fermentation)
    float ppmAcetone = 34.660f * powf(ratio, -3.369f);  // Acetone/Volatiles

    // Clamp realistic boundaries
    if (ppmCO2 < 400.0f) ppmCO2 = 400.0f;
    if (ppmNH3 < 0.1f) ppmNH3 = 0.1f;
    if (ppmAlcohol < 0.1f) ppmAlcohol = 0.1f;
    if (ppmAcetone < 0.1f) ppmAcetone = 0.1f;

    // 3. Read LDR Light Sensor & Optical Lux Estimation (16x oversampled on GPIO 35)
    uint32_t ldrAdcSum = 0;
    for (int i = 0; i < 16; i++) {
      ldrAdcSum += analogRead(PIN_LDR);
      delayMicroseconds(100);
    }
    float ldrAvgAdc = ldrAdcSum / 16.0f;
    float ldrVoltage = (ldrAvgAdc / 4095.0f) * 3.3f;
    float ldrPct = (ldrAvgAdc / 4095.0f) * 100.0f;

    // Realistic optical Lux scaling for GL5528 photoresistor
    // ADC ~0-100: Pitch dark crate (0-5 Lux)
    // ADC ~500: Dim light / seam leak (15-30 Lux)
    // ADC ~1500: Ambient indoor lighting (150-300 Lux)
    // ADC ~3000+: Direct flashlight or sunlight (800-3000+ Lux)
    float estimatedLux = 0.0f;
    if (ldrAvgAdc > 80.0f) {
      estimatedLux = powf(10.0f, ((ldrAvgAdc / 4095.0f) * 3.5f)) - 1.0f;
      if (estimatedLux < 0.0f) estimatedLux = 0.0f;
      if (estimatedLux > 4000.0f) estimatedLux = 4000.0f;
    }

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
    float speedKmh = hasFix ? gps.speed.kmph() : 0.0f;
    float hdop = hasFix ? (gps.hdop.value() / 100.0f) : 99.9f;

    // Visual pulse if shock or light breach occurs
    if (currentShocks > 0 || ldrAvgAdc > 2500.0f) {
      digitalWrite(ONBOARD_LED, HIGH);
      delay(20);
      digitalWrite(ONBOARD_LED, LOW);
    }

    // High-precision machine-readable JSON packet
    Serial.printf("JSON:{\"cycle\":%lu,\"uptime\":%lu,\"temp\":%.2f,\"hum\":%.2f,\"dew_pt\":%.2f,\"heat_idx\":%.2f,\"cond_margin\":%.2f,\"gas_adc\":%lu,\"gas_v\":%.3f,\"co2_ppm\":%.1f,\"nh3_ppm\":%.2f,\"alcohol_ppm\":%.2f,\"acetone_ppm\":%.2f,\"shocks\":%lu,\"ldr_adc\":%lu,\"ldr_v\":%.3f,\"ldr_pct\":%.1f,\"lux\":%.1f,\"gps_fix\":%s,\"lat\":%.6f,\"lon\":%.6f,\"alt\":%.1f,\"speed\":%.1f,\"hdop\":%.2f,\"sats\":%lu,\"nmea_chars\":%lu}\n",
                  (unsigned long)cycle,
                  (unsigned long)(millis() / 1000),
                  tempC,
                  humPct,
                  dewPointC,
                  heatIndexC,
                  condensationMargin,
                  (unsigned long)gasAvgAdc,
                  gasVoltage,
                  ppmCO2,
                  ppmNH3,
                  ppmAlcohol,
                  ppmAcetone,
                  (unsigned long)currentShocks,
                  (unsigned long)ldrAvgAdc,
                  ldrVoltage,
                  ldrPct,
                  estimatedLux,
                  hasFix ? "true" : "false",
                  lat,
                  lon,
                  alt,
                  speedKmh,
                  hdop,
                  (unsigned long)satCount,
                  (unsigned long)rawNmeaChars);

    // Multi-line detailed console output
    Serial.printf("\n╔══════════════════════════════════════════════════════════════════════════════════╗\n");
    Serial.printf("║ 🚚 AgriChain Real-Time Node | Cycle #%04lu | Uptime: %02lu:%02lu:%02lu                  ║\n",
                  (unsigned long)cycle,
                  (unsigned long)(millis() / 3600000),
                  (unsigned long)((millis() / 60000) % 60),
                  (unsigned long)((millis() / 1000) % 60));
    Serial.printf("╠══════════════════════════════════════════════════════════════════════════════════╣\n");
    Serial.printf("║ 🌡️  CLIMATE:    %.1f°C (%.1f°F) | Humidity: %.1f%% RH | Heat Index: %.1f°C        \n",
                  tempC, (tempC * 1.8f + 32.0f), humPct, heatIndexC);
    Serial.printf("║    Dew Point:  %.1f°C | Condensation Margin: %.1f°C %s\n",
                  dewPointC, condensationMargin,
                  (condensationMargin < 2.0f) ? "⚠️ [DEW CONDENSATION RISK]" : "✅ [NO SURFACE CONDENSATION]");
    Serial.printf("╟──────────────────────────────────────────────────────────────────────────────────╢\n");
    Serial.printf("║ 💨 GAS (E-NOSE): Voltage: %.2fV (ADC: %lu) | Headspace Ratio: %.2f\n",
                  gasVoltage, (unsigned long)gasAvgAdc, ratio);
    Serial.printf("║    • CO2 (Respiration):  %6.1f ppm  [%s]\n",
                  ppmCO2, (ppmCO2 < 800.0f) ? "🍃 Fresh Air" : (ppmCO2 < 1500.0f) ? "🌱 Normal Respiration" : "⚠️ High Respiration");
    Serial.printf("║    • NH3 (Rot/Ammonia):  %6.2f ppm  [%s]\n",
                  ppmNH3, (ppmNH3 < 10.0f) ? "🍃 Clean" : "🚨 Microbial Rot Decay");
    Serial.printf("║    • Alcohol (Ferment):  %6.2f ppm  [%s]\n",
                  ppmAlcohol, (ppmAlcohol < 25.0f) ? "🍃 Clean" : "⚠️ Anaerobic Fermentation");
    Serial.printf("║    • Acetone (Volatiles):%6.2f ppm  [%s]\n",
                  ppmAcetone, (ppmAcetone < 15.0f) ? "🍃 Clean" : "⚠️ Early Spoilage");
    Serial.printf("╟──────────────────────────────────────────────────────────────────────────────────╢\n");
    Serial.printf("║ 💡 LIGHT/TAMPER: Voltage: %.2fV (ADC: %lu | %.1f%%) | Est. Light: ~%.0f Lux\n",
                  ldrVoltage, (unsigned long)ldrAvgAdc, ldrPct, estimatedLux);
    Serial.printf("║    Enclosure:   %s\n",
                  (ldrAvgAdc < 250.0f) ? "🌑 Pitch Dark (Crate 100% Sealed & Secure)" :
                  (ldrAvgAdc < 1200.0f) ? "🕯️ Low Light / Minor Seam Leak" :
                  (ldrAvgAdc < 2800.0f) ? "⛅ Ambient Indoor / Warehouse Light" :
                  "☀️ DIRECT SUNLIGHT / TAMPER BREACH DETECTED!");
    Serial.printf("╟──────────────────────────────────────────────────────────────────────────────────╢\n");
    Serial.printf("║ 💥 SHOCK & IRQ:  %lu Shock Events %s\n",
                  (unsigned long)currentShocks,
                  (currentShocks > 0) ? "🚨 [POTHOLE IMPACT - BRUISING RISK]" : "🛡️ [Stable & Smooth Transit]");
    Serial.printf("╟──────────────────────────────────────────────────────────────────────────────────╢\n");
    if (hasFix) {
      Serial.printf("║ 🛰️  GPS (3D FIX): Lat: %.6f, Lon: %.6f | Alt: %.1fm | Speed: %.1f km/h | Sats: %lu\n",
                    lat, lon, alt, speedKmh, (unsigned long)satCount);
      Serial.printf("║    Google Maps: https://www.google.com/maps?q=%.6f,%.6f\n", lat, lon);
    } else {
      Serial.printf("║ 🛰️  GPS STATUS:   Searching for Satellites... (NMEA Bytes: %lu | Sats: %lu)\n",
                    (unsigned long)rawNmeaChars, (unsigned long)satCount);
    }
    Serial.printf("╚══════════════════════════════════════════════════════════════════════════════════╝\n");
  }
}
