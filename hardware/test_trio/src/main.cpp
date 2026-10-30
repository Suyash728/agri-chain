/**
 * @file main.cpp
 * @brief AgriChain Trio Sensor Diagnostic (DHT11 + MQ-135 + SW-420 Shock)
 * @target ESP32 DevKit v1
 * 
 * Pin Connections:
 *  - DHT11: Signal to GPIO 4 (D4), VCC to 3V3, GND to Rail
 *  - MQ-135: AO to GPIO 34 (D34), VCC to VIN (5V), GND to Rail
 *  - SW-420: DO to GPIO 27 (D27), VCC to 3V3, GND to Rail
 */

#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>

#define PIN_DHT11     4
#define DHTTYPE       DHT11
#define PIN_MQ135     34
#define PIN_SW420     27
#define ONBOARD_LED   2

DHT dht(PIN_DHT11, DHTTYPE);

volatile uint32_t totalShocks = 0;
volatile uint32_t lastShockMs = 0;

// Interrupt Service Routine for vibration detection (runs in < 1 microsecond)
void IRAM_ATTR onShockISR() {
  uint32_t now = millis();
  if (now - lastShockMs > 25) { // 25ms hardware debounce
    totalShocks++;
    lastShockMs = now;
  }
}

uint32_t cycle = 0;

void setup() {
  Serial.begin(115200);
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, LOW);

  // Configure SW-420 Interrupt Pin
  pinMode(PIN_SW420, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_SW420), onShockISR, FALLING);

  // Configure ADC1 for MQ-135
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  delay(1500);

  Serial.println("\n=======================================================");
  Serial.println("  🚚 AgriChain Trio Diagnostics: Climate, Gas & Shock  ");
  Serial.println("=======================================================");
  Serial.println("  1. Temperature & Humidity: DHT11 on GPIO 4");
  Serial.println("  2. Biochemical VOC Gas:    MQ-135 on GPIO 34 (ADC1)");
  Serial.println("  3. Transit Mechanical Shock: SW-420 on GPIO 27 (IRQ)");
  Serial.println("=======================================================\n");

  dht.begin();
  delay(1000);
}

void loop() {
  cycle++;

  // Read DHT11
  float tempC = dht.readTemperature();
  float humPct = dht.readHumidity();

  // Read MQ-135 (16x oversampled)
  uint32_t adcSum = 0;
  for (int i = 0; i < 16; i++) {
    adcSum += analogRead(PIN_MQ135);
    delay(3);
  }
  float avgAdc = adcSum / 16.0f;
  float voltage = (avgAdc / 4095.0f) * 3.3f;

  // Snapshot current shock count safely
  noInterrupts();
  uint32_t currentShocks = totalShocks;
  interrupts();

  // If shock occurred, flash LED and flag alert
  if (currentShocks > 0) {
    digitalWrite(ONBOARD_LED, HIGH);
  }

  Serial.printf("[CYCLE #%03u] 🌡️ %.1f°C | 💧 %.1f%% RH | 💨 Gas: %.2fV | 💥 Shocks Detected: %u %s\n",
                cycle, 
                isnan(tempC) ? 0.0f : tempC, 
                isnan(humPct) ? 0.0f : humPct, 
                voltage,
                currentShocks,
                (currentShocks > 0) ? "🚨 [POTHOLE/IMPACT]" : "🛡️ [Stable]");

  if (currentShocks > 0) {
    delay(100);
    digitalWrite(ONBOARD_LED, LOW);
  }

  delay(2000);
}
