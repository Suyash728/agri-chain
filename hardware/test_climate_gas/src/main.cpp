/**
 * @file main.cpp
 * @brief AgriChain Dual Climate & Spoilage Gas Diagnostics (DHT11 + MQ-135)
 * @target ESP32 DevKit v1
 * 
 * Pin Connections:
 *  - DHT11: Signal to GPIO 4 (D4), VCC to 3V3, GND to Rail
 *  - MQ-135: AO to GPIO 34 (D34), VCC to VIN (5V), GND to Rail
 */

#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>

#define PIN_DHT11   4
#define DHTTYPE     DHT11
#define PIN_MQ135   34
#define ONBOARD_LED 2

DHT dht(PIN_DHT11, DHTTYPE);
uint32_t cycle = 0;

void setup() {
  Serial.begin(115200);
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW);

  // Configure ADC1 for 12-bit resolution (0 - 4095) up to 3.3V
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  delay(1500);

  Serial.println("\n=======================================================");
  Serial.println("  🍇 AgriChain Dual Sensor Diagnostic: Climate & Gas   ");
  Serial.println("=======================================================");
  Serial.println("  1. Temperature & Humidity: DHT11 on GPIO 4");
  Serial.println("  2. Biochemical VOC Gas:    MQ-135 on GPIO 34 (ADC1)");
  Serial.println("=======================================================\n");

  dht.begin();
  delay(1000);
}

void loop() {
  cycle++;

  // Pulse LED to show active acquisition
  digitalWrite(ONBOARD_LED, HIGH);
  delay(40);
  digitalWrite(ONBOARD_LED, LOW);

  // 1. Read DHT11
  float tempC = dht.readTemperature();
  float humPct = dht.readHumidity();

  // 2. Read MQ-135 with 16x oversampling for clean signal
  uint32_t adcSum = 0;
  for (int i = 0; i < 16; i++) {
    adcSum += analogRead(PIN_MQ135);
    delay(4);
  }
  float avgAdc = adcSum / 16.0f;
  float voltage = (avgAdc / 4095.0f) * 3.3f;

  // Simple Air Quality / Organic Volatile Evaluation
  const char* statusStr = "🍃 Fresh / Clean Air";
  if (voltage > 2.0f) {
    statusStr = "🚨 High VOC / Spoilage Alert!";
  } else if (voltage > 1.2f) {
    statusStr = "⚠️ Moderate Volatiles Detected";
  }

  if (isnan(tempC) || isnan(humPct)) {
    Serial.printf("[CYCLE #%03u] ⚠️ DHT11 read error! | MQ-135 ADC: %4.0f (%.2f V) -> %s\n",
                  cycle, avgAdc, voltage, statusStr);
  } else {
    Serial.printf("[CYCLE #%03u] 🌡️ %.1f°C | 💧 %.1f%% RH | 💨 Gas ADC: %4.0f (%.2f V) | %s\n",
                  cycle, tempC, humPct, avgAdc, voltage, statusStr);
  }

  delay(2000);
}
