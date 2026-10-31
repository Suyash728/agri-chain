/**
 * @file main.cpp
 * @brief AgriChain ESP32 + Blynk IoT Mobile App Telemetry Bridge
 * @target ESP32 DevKit v1 / NodeMCU-32S
 * 
 * Virtual Pin Mapping:
 *  - V0: Temperature (°C) -> Gauge / Value Display
 *  - V1: Relative Humidity (%) -> Gauge / Value Display
 *  - V2: Spoilage VOC Gas (ppm) -> SuperChart / Value Display
 *  - V3: Mechanical Shock Alert -> LED Widget (0=Normal, 1=Impact)
 *  - V4: Vehicle GPS Location -> Map Widget (Nashik -> Pune Highway)
 *  - V10: Remote LED Control -> Button Widget (Allows toggling onboard LED from iPhone)
 */

// ==================== BLYNK CONFIGURATION ====================
#define BLYNK_TEMPLATE_ID   "TMPL3lVyMSoXu"
#define BLYNK_TEMPLATE_NAME "AgriChain Node"
#define BLYNK_AUTH_TOKEN    "tw0QSnz6Ai1KVz9FCQ2Uf0KBOR5tQmEp"

#define BLYNK_PRINT Serial

#include <Arduino.h>
#include <WiFi.h>
#include <BlynkSimpleEsp32.h>

// Enter your Wi-Fi or mobile hotspot credentials:
char wifiSSID[] = "Home WiFi";       // Update with your Wi-Fi SSID
char wifiPass[] = "YourPassword";    // Update with your Wi-Fi Password

#define ONBOARD_LED 2

BlynkTimer timer;

// Simulated/Sensors dynamic values
float simTemp = 4.5f;
float simHum = 88.0f;
float simVOC = 14.2f;
int shockFlag = 0;
double simLat = 19.9975;
double simLon = 73.7898;
int telemetryCycle = 0;

// Remote LED switch from Blynk App (Button on V10)
BLYNK_WRITE(V10) {
  int pinValue = param.asInt();
  digitalWrite(ONBOARD_LED, pinValue ? HIGH : LOW);
  Serial.printf("[BLYNK] Remote iPhone command: Onboard LED set to %s\n", pinValue ? "ON" : "OFF");
}

void pushTelemetryToBlynk() {
  telemetryCycle++;

  // Modulate realistic cold-chain drift
  simTemp = 4.0f + (sin(telemetryCycle * 0.2f) * 1.5f);
  simHum = 86.0f + (cos(telemetryCycle * 0.2f) * 4.0f);
  simVOC = 12.0f + (telemetryCycle % 10) * 0.8f;
  simLat += 0.0003;
  simLon += 0.0004;

  // 1. Push Temperature to V0
  Blynk.virtualWrite(V0, simTemp);

  // 2. Push Humidity to V1
  Blynk.virtualWrite(V1, simHum);

  // 3. Push VOC Gas to V2
  Blynk.virtualWrite(V2, simVOC);

  // 4. Push Shock / Tamper to V3
  Blynk.virtualWrite(V3, (telemetryCycle % 8 == 0) ? 1 : 0);

  // 5. Push GPS Coordinates to Map on V4
  // Format for Blynk Map: index, lat, lon, "label"
  Blynk.virtualWrite(V4, 1, simLat, simLon, "AgriChain Cold-Truck #104");

  Serial.printf("[BLYNK STREAM #%d] Temp: %.1f C | Hum: %.1f %% | VOC: %.1f ppm | GPS: %.4f, %.4f\n",
                telemetryCycle, simTemp, simHum, simVOC, simLat, simLon);
}

void setup() {
  Serial.begin(115200);
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW);

  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("  📱 AgriChain ESP32 <-> Blynk IoT Mobile Bridge       ");
  Serial.println("=======================================================");

  Blynk.begin(BLYNK_AUTH_TOKEN, wifiSSID, wifiPass);

  // Push telemetry every 2 seconds to phone
  timer.setInterval(2000L, pushTelemetryToBlynk);
}

void loop() {
  Blynk.run();
  timer.run();
}
