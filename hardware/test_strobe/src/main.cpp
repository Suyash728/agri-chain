/**
 * @file main.cpp
 * @brief ESP32 Onboard Strobing LED & Hardware Diagnostics Test
 * @target ESP32 DevKit v1 / NodeMCU-32S (ESP-WROOM-32)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <esp_system.h>
#include <esp_chip_info.h>

// Onboard LED is typically on GPIO 2 for standard ESP32 DevKit boards
#define LED_PIN_PRIMARY   2
#define LED_PIN_ALT1      4
#define LED_PIN_ALT2      5

uint32_t cycleCount = 0;

void printSystemDiagnostics() {
  esp_chip_info_t chip_info;
  esp_chip_info(&chip_info);

  Serial.println("\n=======================================================");
  Serial.println("  🌟 AgriChain ESP32 Hardware Diagnostics & Strobe Test");
  Serial.println("=======================================================");
  Serial.printf("  Chip Model:        ESP32 (Silicon Rev %d)\n", chip_info.revision);
  Serial.printf("  CPU Cores:         %d cores @ %u MHz\n", chip_info.cores, (unsigned)getCpuFrequencyMhz());
  Serial.printf("  Flash Size:        %u MB\n", (unsigned)(ESP.getFlashChipSize() / (1024 * 1024)));
  Serial.printf("  Free Heap Memory:  %u bytes\n", (unsigned)esp_get_free_heap_size());
  Serial.printf("  Default MAC Addr:  %s\n", WiFi.macAddress().c_str());
  Serial.println("=======================================================");
  Serial.println("  [STATUS] Strobing LED on GPIO 2 active.\n");
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(LED_PIN_PRIMARY, OUTPUT);
  pinMode(LED_PIN_ALT1, OUTPUT);
  pinMode(LED_PIN_ALT2, OUTPUT);

  // Turn all off initially
  digitalWrite(LED_PIN_PRIMARY, LOW);
  digitalWrite(LED_PIN_ALT1, LOW);
  digitalWrite(LED_PIN_ALT2, LOW);

  printSystemDiagnostics();
}


void strobeBurst(int flashes, int onTimeMs, int offTimeMs) {
  for (int i = 0; i < flashes; i++) {
    digitalWrite(LED_PIN_PRIMARY, HIGH);
    digitalWrite(LED_PIN_ALT1, HIGH);
    digitalWrite(LED_PIN_ALT2, HIGH);
    delay(onTimeMs);
    digitalWrite(LED_PIN_PRIMARY, LOW);
    digitalWrite(LED_PIN_ALT1, LOW);
    digitalWrite(LED_PIN_ALT2, LOW);
    delay(offTimeMs);
  }
}

void loop() {
  cycleCount++;
  Serial.printf("[STROBE CYCLE #%u] Firing strobe sequence...\n", cycleCount);

  // Pattern 1: Rapid Camera Flash Strobe (3 quick bursts)
  strobeBurst(3, 40, 50);
  delay(150);

  // Pattern 2: Tactical Double Strobe
  strobeBurst(2, 60, 60);
  delay(200);

  // Pattern 3: High-Frequency Strobe Burst (6 rapid pulses)
  strobeBurst(6, 25, 30);
  delay(600);

  // Pattern 4: Heartbeat Pulse (2 longer beats)
  strobeBurst(1, 150, 100);
  strobeBurst(1, 250, 400);

  delay(800);
}
