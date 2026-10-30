/**
 * @file main.cpp
 * @brief DHT11 Live Temperature & Humidity Sensor Test
 * @target ESP32 DevKit v1 (DHT11 connected to GPIO 4)
 */

#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>

#define DHTPIN  4
#define DHTTYPE DHT11
#define LED_PIN 2

DHT dht(DHTPIN, DHTTYPE);
uint32_t readingCount = 0;

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  delay(1500);

  Serial.println("\n=======================================================");
  Serial.println("  🌡️ AgriChain DHT11 Sensor Live Diagnostics           ");
  Serial.println("=======================================================");
  Serial.println("  Sensor Type:   DHT11 (Blue Module)");
  Serial.println("  Signal Pin:    GPIO 4 (D4)");
  Serial.println("  Status:        Initializing sensor...");
  Serial.println("=======================================================\n");

  dht.begin();
  delay(1000);
}

void loop() {
  readingCount++;

  // Blink LED to indicate sampling attempt
  digitalWrite(LED_PIN, HIGH);
  delay(50);
  digitalWrite(LED_PIN, LOW);

  float humidity = dht.readHumidity();
  float tempC = dht.readTemperature();

  if (isnan(humidity) || isnan(tempC)) {
    Serial.printf("[READING #%u] ⚠️ Failed to read from DHT11! Check wire connections on D4, 3V3, GND.\n", readingCount);
  } else {
    float heatIndexC = dht.computeHeatIndex(tempC, humidity, false);

    Serial.printf("[READING #%03u] 🌡️ Temp: %.1f °C  |  💧 Humidity: %.1f %%  |  🔥 Heat Index: %.1f °C\n",
                  readingCount, tempC, humidity, heatIndexC);
  }

  // DHT11 sampling rate is ~1 Hz (every 2 seconds is optimal)
  delay(2000);
}
