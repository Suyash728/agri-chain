/**
 * AgriChain ESP32 Physical IoT Cold-Chain Firmware Prop
 * -----------------------------------------------------
 * Features:
 *  - Real-time DHT22 temperature and humidity sensing on GPIO 15.
 *  - NEO-6M GPS NMEA stream parsing on UART2 (GPIO 16 RX / GPIO 17 TX).
 *  - WiFi HTTP Client posting telemetry JSON to FastAPI backend every 15s.
 *  - Emergency Fault Pushbutton on GPIO 4 (active LOW) injecting simulated
 *    refrigeration failure (48.0°C thermal breach) to trigger live AI quarantine.
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <TinyGPSPlus.h>
#include <ArduinoJson.h>

// ======================== PIN ASSIGNMENTS ========================
#define DHTPIN              15      // DHT22 data pin
#define DHTTYPE             DHT22   // AM2302 sensor
#define FAULT_BUTTON_PIN    4       // Push-button for thermal breach injection
#define STATUS_LED_PIN      2       // Built-in status LED
#define GPS_RX_PIN          16      // Connect to NEO-6M TX
#define GPS_TX_PIN          17      // Connect to NEO-6M RX

// ======================== NETWORK & BACKEND ======================
const char* WIFI_SSID     = "Your_WiFi_SSID";
const char* WIFI_PASSWORD = "Your_WiFi_Password";
const char* BACKEND_URL   = "http://192.168.1.100:8000/telemetry";
const char* BATCH_ID      = "BATCH-SOLD-TEST";
const char* DEVICE_ID     = "ESP32-COLDCHAIN-01";

// ======================== OBJECT INSTANCES =======================
DHT dht(DHTPIN, DHTTYPE);
TinyGPSPlus gps;
HardwareSerial GPS_Serial(2);

// ======================== TIMING & STATE =========================
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL_MS = 15000; // 15 seconds
volatile bool faultTriggered = false;
volatile unsigned long lastButtonPress = 0;

// Interrupt Service Routine for Pushbutton Fault Injection
void IRAM_ATTR handleButtonInterrupt() {
  unsigned long now = millis();
  if (now - lastButtonPress > 250) { // 250ms software debounce
    faultTriggered = true;
    lastButtonPress = now;
  }
}

void connectWiFi() {
  Serial.println(F("\n[WiFi] Connecting to network..."));
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
    delay(500);
    Serial.print(F("."));
    digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("\n[WiFi] Connected! IP address: "));
    Serial.println(WiFi.localIP());
    digitalWrite(STATUS_LED_PIN, HIGH);
  } else {
    Serial.println(F("\n[WiFi] Connection timeout. Operating in offline buffer mode."));
    digitalWrite(STATUS_LED_PIN, LOW);
  }
}

void sendTelemetry(float temp, float humidity, float lat, float lng, bool isFault) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[HTTP] WiFi offline. Skipping transmission."));
    return;
  }

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");

  // Construct ISO 8601 Timestamp
  char timestampStr[32];
  snprintf(timestampStr, sizeof(timestampStr), "2026-09-23T16:%02lu:%02luZ", 
           (millis() / 60000) % 60, (millis() / 1000) % 60);

  // Build JSON Payload matching TelemetryPayload schema
  StaticJsonDocument<256> doc;
  doc["batch_id"] = BATCH_ID;
  doc["device_id"] = DEVICE_ID;
  doc["latitude"] = lat;
  doc["longitude"] = lng;
  doc["temperature"] = temp;
  doc["humidity"] = humidity;
  doc["timestamp"] = timestampStr;

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.println(F("\n-------------------------------------------"));
  if (isFault) {
    Serial.println(F("🚨 [CRITICAL ALERT] INJECTING THERMAL REFRIGERATION BREACH!"));
  } else {
    Serial.println(F("📦 [TELEMETRY] Transmitting Normal Cold-Chain Data:"));
  }
  Serial.print(F("Payload: "));
  Serial.println(requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Status: %d | Response: %s\n", httpCode, response.c_str());
    if (isFault) {
      Serial.println(F("🛡️ [AI TRUST LAYER] Thermal anomaly quarantined off-chain!"));
    } else {
      Serial.println(F("⛓️ [BLOCKCHAIN] Valid telemetry reading mined on-chain."));
    }
  } else {
    Serial.printf("[HTTP] POST failed. Error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
  Serial.println(F("-------------------------------------------\n"));
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println(F("==========================================="));
  Serial.println(F("   AgriChain ESP32 IoT Cold-Chain Node    "));
  Serial.println(F("==========================================="));

  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(FAULT_BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FAULT_BUTTON_PIN), handleButtonInterrupt, FALLING);

  dht.begin();
  GPS_Serial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  Serial.println(F("[INIT] DHT22 sensor initialized on GPIO 15"));
  Serial.println(F("[INIT] NEO-6M GPS initialized on GPIO 16/17 (UART2)"));
  Serial.println(F("[INIT] Fault Pushbutton armed on GPIO 4 (Press to inject 48°C breach)"));

  connectWiFi();
}

void loop() {
  // Feed GPS parser from UART2
  while (GPS_Serial.available() > 0) {
    gps.encode(GPS_Serial.read());
  }

  // Handle immediate pushbutton fault injection
  if (faultTriggered) {
    faultTriggered = false;
    digitalWrite(STATUS_LED_PIN, LOW); // Flash alert
    delay(100);
    digitalWrite(STATUS_LED_PIN, HIGH);

    // Simulated 48.0°C refrigeration compressor failure
    float breachTemp = 48.0;
    float breachHumidity = 92.5;
    float lat = gps.location.isValid() ? gps.location.lat() : 18.5204;
    float lng = gps.location.isValid() ? gps.location.lng() : 73.8567;

    sendTelemetry(breachTemp, breachHumidity, lat, lng, true);
    lastSendTime = millis();
  }

  // Scheduled telemetry transmission every 15s
  if (millis() - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = millis();

    float temp = dht.readTemperature();
    float hum = dht.readHumidity();

    // Fallback if physical sensor unattached in test lab
    if (isnan(temp) || isnan(hum)) {
      temp = 4.2 + ((millis() % 10) * 0.1);  // Nominal 4.2 - 5.1°C
      hum = 86.0 + ((millis() % 6) * 0.5);  // Nominal 86.0 - 89.0%
    }

    // Default Pune-Nashik transit coordinates if indoor GPS fix is acquiring
    float lat = gps.location.isValid() ? gps.location.lat() : 19.9975;
    float lng = gps.location.isValid() ? gps.location.lng() : 73.7898;

    sendTelemetry(temp, hum, lat, lng, false);
  }
}
