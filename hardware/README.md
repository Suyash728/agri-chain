# AgriChain ESP32 IoT Telemetry & Hardware Simulation

> **Physical IoT sensor node firmware specifications and Python simulation runner for transit cold-chain monitoring.**

---

## 1. Hardware Architecture & Bill of Materials

| Component | Function | Interface / Pin |
|---|---|---|
| **ESP32 NodeMCU** | Microcontroller & WiFi HTTP client | Micro-USB |
| **DHT22 (AM2302)** | Precision temperature & humidity sensor | GPIO 15 (Pull-up 10kΩ) |
| **NEO-6M GPS Module**| Real-time GPS transit coordinates | UART2: GPIO 16 (RX) / GPIO 17 (TX) |
| **Tactile Push Button**| Refrigeration failure / tamper breach button | GPIO 4 (`INPUT_PULLUP` to GND) |
| **Status LED** | Visual heartbeat & fault indicator | GPIO 2 (Onboard LED) |

---

## 2. Wiring Diagram

```text
       +---------------------------------------------+
       |                  ESP32 DevKit               |
       |  [3V3] ------------------- DHT22 VCC        |
       |  [GND] ------------------- DHT22 GND        |
       |  [D15] ------------------- DHT22 DATA       |
       |  [VIN] ------------------- NEO-6M VCC (5V)  |
       |  [GND] ------------------- NEO-6M GND       |
       |  [D16] (RX2) ------------- NEO-6M TX        |
       |  [D17] (TX2) ------------- NEO-6M RX        |
       |  [D4]  ----+----[ Pushbutton ]----+ [GND]   |
       +---------------------------------------------+
```

---

## 3. Firmware Flashing (PlatformIO)

1. Open `hardware/esp32_firmware/` in VS Code with PlatformIO.
2. In `src/main.cpp`, update WiFi credentials and target backend host:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_Network";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   const char* BACKEND_URL   = "http://<YOUR_LOCAL_IP>:8000/telemetry";
   ```
3. Flash and monitor:
   ```bash
   pio run --target upload && pio device monitor
   ```

---

## 4. Hardware Simulation Runner

Run without physical hardware:

```bash
# 1. Complete demo (normal reading + breach button trigger + quarantine audit)
python hardware/simulate_esp32.py --mode demo

# 2. Simulated refrigeration failure (48°C breach)
python hardware/simulate_esp32.py --mode fault

# 3. Continuous nominal stream
python hardware/simulate_esp32.py --mode stream --count 5
```
