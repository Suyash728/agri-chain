# AgriChain ESP32 Physical IoT Cold-Chain Hardware Prop

This folder contains the complete firmware, wiring specifications, and software simulation for the physical IoT sensor node deployed on transport vehicles and cold-storage chambers.

---

## 1. Hardware Architecture & Bill of Materials

| Component | Function | Interface / Pin |
|---|---|---|
| **ESP32 NodeMCU (30-pin / 38-pin)** | Main microcontroller & WiFi HTTP client | Micro-USB |
| **DHT22 (AM2302)** | High-precision temperature & humidity sensor | GPIO 15 (Pull-up 10kΩ) |
| **NEO-6M GPS Module** | Live transit latitude & longitude tracking | UART2: GPIO 16 (RX) / GPIO 17 (TX) |
| **Tactile Push Button** | Emergency refrigeration breach trigger | GPIO 4 (Internal `INPUT_PULLUP` to GND) |
| **Status LED** | Visual heartbeat & fault indicator | GPIO 2 (Onboard LED) |

---

## 2. Circuit Wiring Diagram

```text
       +---------------------------------------------+
       |                  ESP32 DevKit               |
       |                                             |
       |  [3V3] ------------------- DHT22 VCC        |
       |  [GND] ------------------- DHT22 GND        |
       |  [D15] ------------------- DHT22 DATA       |
       |                                             |
       |  [VIN] ------------------- NEO-6M VCC (5V)  |
       |  [GND] ------------------- NEO-6M GND       |
       |  [D16] (RX2) ------------- NEO-6M TX        |
       |  [D17] (TX2) ------------- NEO-6M RX        |
       |                                             |
       |  [D4]  ----+----[ Pushbutton ]----+ [GND]   |
       |            |                                |
       |     (Internal Pullup)                       |
       +---------------------------------------------+
```

---

## 3. How to Flash the ESP32 Firmware

### Using PlatformIO (VS Code or CLI)
1. Open the `hardware/esp32_firmware/` directory in VS Code with PlatformIO extension installed.
2. In `src/main.cpp`, update your WiFi credentials and your computer's local IP:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_Network";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   const char* BACKEND_URL   = "http://192.168.1.100:8000/telemetry";
   ```
3. Connect your ESP32 via USB and run:
   ```bash
   pio run --target upload
   pio device monitor
   ```

---

## 4. Hardware Simulation Runner

For quick evaluation, continuous integration testing, or demonstrations without physical hardware:

```bash
# Run complete demo: normal cold-chain reading + GPIO 4 breach button press + quarantine check
.venv\Scripts\python.exe hardware\simulate_esp32.py --mode demo

# Inject single simulated refrigeration failure (48°C breach)
.venv\Scripts\python.exe hardware\simulate_esp32.py --mode fault

# Stream continuous 15-second nominal telemetry packets
.venv\Scripts\python.exe hardware\simulate_esp32.py --mode stream --count 5
```
