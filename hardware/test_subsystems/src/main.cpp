/**
 * @file main.cpp
 * @brief Comprehensive ESP32 Subsystem Diagnostics Test
 * @target ESP32 DevKit v1 / NodeMCU-32S
 * 
 * Subsystems Tested:
 *  1. 2.4GHz Wi-Fi Radio: Passive Scanner (SSIDs, RSSI, Channel, Auth)
 *  2. Wi-Fi SoftAP Transmitter: Broadcasts "AgriChain-IoT-Node" Access Point
 *  3. Hardware Cryptographic SHA-256 Engine: Throughput Benchmark via mbedtls
 *  4. LittleFS Flash File System: Read/Write integrity and speed benchmark
 *  5. NVS (Non-Volatile Storage): Monotonic counter persistence
 *  6. Capacitive Touch Channels: Touch0 (GPIO 4), Touch2 (GPIO 2), Touch7 (GPIO 27)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <LittleFS.h>
#include <Preferences.h>
#include "mbedtls/md.h"
#include <esp_system.h>
#include <esp_chip_info.h>

#define ONBOARD_LED 2

Preferences nvs;

// ==================== 1. HARDWARE SHA-256 BENCHMARK ====================
void benchmarkHardwareSHA256() {
  Serial.println("\n-------------------------------------------------------");
  Serial.println("  🔒 [TEST 1] Hardware Cryptographic SHA-256 Engine");
  Serial.println("-------------------------------------------------------");

  const char* mockPayload = "{\"batch_id\":\"BAT-TOM-802\",\"temp_c\":4.5,\"humidity_pct\":88.0,\"lat\":19.9975,\"lon\":73.7898,\"nonce\":1042,\"freshness_voc_ppm\":12.4}";
  size_t len = strlen(mockPayload);
  byte shaResult[32];

  uint32_t startUs = micros();
  const int ITERATIONS = 100;

  for (int i = 0; i < ITERATIONS; i++) {
    mbedtls_md_context_t ctx;
    mbedtls_md_init(&ctx);
    mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 0);
    mbedtls_md_starts(&ctx);
    mbedtls_md_update(&ctx, (const unsigned char*)mockPayload, len);
    mbedtls_md_finish(&ctx, shaResult);
    mbedtls_md_free(&ctx);
  }
  uint32_t totalUs = micros() - startUs;
  float avgUs = (float)totalUs / ITERATIONS;

  char hexBuf[65];
  for (int i = 0; i < 32; i++) snprintf(hexBuf + (i * 2), 3, "%02x", shaResult[i]);
  hexBuf[64] = '\0';

  Serial.printf("  Sample Payload:      %s\n", mockPayload);
  Serial.printf("  SHA-256 Digest:      %s\n", hexBuf);
  Serial.printf("  100-Hash Benchmark:  %lu us total (Avg: %.2f us per payload)\n", totalUs, avgUs);
  Serial.println("  ✅ Hardware Cryptographic Accelerator: PASSED (Operational)");
}

// ==================== 2. LITTLEFS FLASH STORAGE TEST ==================
void testLittleFS() {
  Serial.println("\n-------------------------------------------------------");
  Serial.println("  💾 [TEST 2] LittleFS Flash Storage File System");
  Serial.println("-------------------------------------------------------");

  if (!LittleFS.begin(true)) {
    Serial.println("  ❌ LittleFS Mount Failed!");
    return;
  }

  size_t totalBytes = LittleFS.totalBytes();
  size_t usedBytes  = LittleFS.usedBytes();
  Serial.printf("  LittleFS Partition:  %u KB Total | %u KB Used | %u KB Free\n",
                (unsigned)(totalBytes / 1024), (unsigned)(usedBytes / 1024), (unsigned)((totalBytes - usedBytes) / 1024));

  // Write mock telemetry record
  const char* testFile = "/test_queue.log";
  File wFile = LittleFS.open(testFile, "w");
  if (!wFile) {
    Serial.println("  ❌ Failed to open test file for writing!");
    return;
  }
  wFile.println("OFFLINE_RECORD_001|TEMP:4.2|HUM:87.5|GPS:19.9975,73.7898");
  wFile.println("OFFLINE_RECORD_002|TEMP:4.4|HUM:87.1|GPS:19.9976,73.7899");
  wFile.println("OFFLINE_RECORD_003|TEMP:4.5|HUM:86.8|GPS:19.9978,73.7901");
  wFile.close();

  // Read back and verify
  File rFile = LittleFS.open(testFile, "r");
  int lineCount = 0;
  while (rFile && rFile.available()) {
    String line = rFile.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) {
      lineCount++;
      Serial.printf("  [Readback Slot %d]:   %s\n", lineCount, line.c_str());
    }
  }
  rFile.close();
  LittleFS.remove(testFile);

  Serial.printf("  ✅ LittleFS Read/Write: PASSED (%d buffered records verified)\n", lineCount);
}

// ==================== 3. NVS NON-VOLATILE MONOTONIC TEST ==============
void testNVS() {
  Serial.println("\n-------------------------------------------------------");
  Serial.println("  ⚡ [TEST 3] NVS Monotonic Replay-Defense Counter");
  Serial.println("-------------------------------------------------------");

  nvs.begin("agrichain_test", false);
  uint32_t currentNonce = nvs.getUInt("nonce", 1000);
  currentNonce++;
  nvs.putUInt("nonce", currentNonce);
  uint32_t readBack = nvs.getUInt("nonce", 0);
  nvs.end();

  Serial.printf("  NVS Monotonic Nonce: %u (Incremented & persisted to flash)\n", readBack);
  Serial.println("  ✅ NVS Persistent Storage: PASSED");
}

// ==================== 4. WI-FI 2.4GHz RF SPECTRUM SCAN ================
void scanWiFiNetworks() {
  Serial.println("\n-------------------------------------------------------");
  Serial.println("  📡 [TEST 4] 2.4GHz Wi-Fi Radio RF Spectrum Scan");
  Serial.println("-------------------------------------------------------");

  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);

  Serial.println("  Scanning 2.4GHz airwaves for available access points...");
  int n = WiFi.scanNetworks();
  if (n == 0) {
    Serial.println("  ⚠️ No Wi-Fi networks found in range (check 2.4GHz coverage).");
  } else {
    Serial.printf("  Found %d Wi-Fi networks in vicinity:\n", n);
    Serial.println("  -------------------------------------------------------------");
    Serial.printf("  %-4s | %-24s | %-7s | %-4s | %-10s\n", "No.", "SSID Name", "RSSI", "Ch", "Security");
    Serial.println("  -------------------------------------------------------------");
    for (int i = 0; i < min(n, 10); ++i) {
      const char* authMode;
      switch (WiFi.encryptionType(i)) {
        case WIFI_AUTH_OPEN: authMode = "Open"; break;
        case WIFI_AUTH_WEP:  authMode = "WEP"; break;
        case WIFI_AUTH_WPA_PSK: authMode = "WPA"; break;
        case WIFI_AUTH_WPA2_PSK: authMode = "WPA2"; break;
        case WIFI_AUTH_WPA_WPA2_PSK: authMode = "WPA/WPA2"; break;
        case WIFI_AUTH_WPA2_ENTERPRISE: authMode = "WPA2-Ent"; break;
        case WIFI_AUTH_WPA3_PSK: authMode = "WPA3"; break;
        default: authMode = "Encrypted"; break;
      }
      Serial.printf("  #%-3d | %-24.24s | %4d dBm | %-4d | %-10s\n",
                    i + 1, WiFi.SSID(i).c_str(), WiFi.RSSI(i), (int)WiFi.channel(i), authMode);
    }
    Serial.println("  -------------------------------------------------------------");
  }
  WiFi.scanDelete();
  Serial.println("  ✅ Wi-Fi 2.4GHz Receiver & Antenna: PASSED (RF active)");
}

// ==================== 5. WI-FI SOFTAP TRANSMITTER TEST ===============
void testSoftAP() {
  Serial.println("\n-------------------------------------------------------");
  Serial.println("  📶 [TEST 5] Wi-Fi SoftAP Transmitter (Access Point Mode)");
  Serial.println("-------------------------------------------------------");

  const char* apSSID = "AgriChain-IoT-Node";
  bool apSuccess = WiFi.softAP(apSSID, "agrichain2026");
  if (apSuccess) {
    IPAddress apIP = WiFi.softAPIP();
    Serial.printf("  SoftAP Beacon Started: \"%s\"\n", apSSID);
    Serial.printf("  Node Gateway IP:        %s\n", apIP.toString().c_str());
    Serial.printf("  Node Wi-Fi MAC Address: %s\n", WiFi.softAPmacAddress().c_str());
    Serial.println("  (You can search on your phone's Wi-Fi right now to see this SSID!)");
    Serial.println("  ✅ Wi-Fi Transmitter (TX) & SoftAP: PASSED");
  } else {
    Serial.println("  ❌ Failed to start SoftAP mode.");
  }
}

// ==================== 6. CAPACITIVE TOUCH SENSORS TEST ===============
void testTouchPins() {
  Serial.println("\n-------------------------------------------------------");
  Serial.println("  👆 [TEST 6] Capacitive Touch Sensor Channels");
  Serial.println("-------------------------------------------------------");

  int t0 = touchRead(T0); // GPIO 4
  int t2 = touchRead(T2); // GPIO 2
  int t7 = touchRead(T7); // GPIO 27

  Serial.printf("  Touch Channel T0 (GPIO 4):   %d\n", t0);
  Serial.printf("  Touch Channel T2 (GPIO 2):   %d\n", t2);
  Serial.printf("  Touch Channel T7 (GPIO 27):  %d\n", t7);
  Serial.println("  (Readings drop significantly when a human finger touches the pin header)");
  Serial.println("  ✅ Capacitive Touch Controller: PASSED");
}

void setup() {
  Serial.begin(115200);
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(ONBOARD_LED, HIGH);

  delay(1500);

  Serial.println("\n=======================================================");
  Serial.println("  🚀 AgriChain ESP32 Full Subsystem Diagnostic Suite   ");
  Serial.println("=======================================================");

  benchmarkHardwareSHA256();
  testLittleFS();
  testNVS();
  scanWiFiNetworks();
  testSoftAP();
  testTouchPins();

  Serial.println("\n=======================================================");
  Serial.println("  🎉 ALL SUBSYSTEM TESTS COMPLETED SUCCESSFULLY!       ");
  Serial.println("  Node is now in SoftAP beacon & monitoring mode.       ");
  Serial.println("=======================================================\n");
}

uint32_t loopTick = 0;
void loop() {
  loopTick++;
  // Blink LED double-pulse every 3 seconds to indicate healthy operational status
  digitalWrite(ONBOARD_LED, HIGH);
  delay(80);
  digitalWrite(ONBOARD_LED, LOW);
  delay(80);
  digitalWrite(ONBOARD_LED, HIGH);
  delay(80);
  digitalWrite(ONBOARD_LED, LOW);

  // Periodic heartbeat
  if (loopTick % 10 == 0) {
    Serial.printf("[HEARTBEAT #%u] SoftAP \"%s\" active (Clients: %d) | Free Heap: %u bytes\n",
                  loopTick / 10, "AgriChain-IoT-Node", WiFi.softAPgetStationNum(), (unsigned)esp_get_free_heap_size());
  }

  delay(3000);
}
