# AgriChain Physical IoT Telemetry & Hardware Specification

> **Physical IoT edge node firmware, hardware architecture, and simulation runner for cold-chain produce monitoring.**  
> **Detailed Engineering Specification:** See [`docs/IOT_HARDWARE_SPECIFICATION.md`](../docs/IOT_HARDWARE_SPECIFICATION.md) for the 49-page synthesis, itemized BOM, biochemical equations, and 7-day sprint plan.

---

## 1. Hardware Architecture & Itemized BOM (₹2,165.94 INR)

| Component | Function | Indian Price (INR) | Primary Supplier | Interface / Pin |
| :--- | :--- | :---: | :--- | :--- |
| **ESP32 DevKit v1** | Dual-core MCU, Wi-Fi, HW SHA-256 | ₹400.02 | ElectronicsComp | Core Controller |
| **DHT22 (AM2302)** | Precision temperature & humidity | ₹179.36 | ElectronicsComp | GPIO 4 (4.7kΩ pull-up to 3.3V) |
| **MQ-135 Gas Sensor** | Ethylene / VOC / spoilage detection | ₹119.00 | Robu.in | GPIO 34 (ADC1_CH6 via 10k/20k divider) |
| **u-blox NEO-6M GPS** | Real-time highway coordinates | ₹232.46 | ElectronicsComp | UART2: GPIO 16 (RX2) / GPIO 17 (TX2) |
| **SW-420 Vibration** | Transit shock & rough handling | ₹211.22 | ElectronicsComp | GPIO 27 (External Interrupt, FALLING) |
| **GL5528 CdS LDR** | Optical lid-open tamper latch | ₹15.00 | Local / Robu | GPIO 35 (ADC1_CH7 with 10kΩ pull-down) |
| **LG INR18650 Li-Ion** | 2600mAh primary energy storage | ₹387.00 | Robu.in | 3.7V / 9.62 Wh |
| **TP4056 + DW01A** | Type-C 1A battery charge & BMS | ₹18.88 | ElectronicsComp | Li-Ion Management |
| **MT3608 Boost** | Step-up DC-DC boost (5.05V rail) | ₹39.00 | Robu.in | Supplies 5V for MQ-135 & VIN |
| **F1 IP65 ABS Box** | Dual-chamber protective housing | ₹269.00 | Robu.in | Crate-mounted enclosure |
| **Passives & Wiring** | Resistors, caps, breadboard, wires | ₹440.00 | Local / Robu | $470\mu\text{F}, 100\mu\text{F}, 100\text{nF}$, jumpers |

---

## 2. Hardware Wiring Diagram

```text
                  +----------------------------------------------+
                  |               ESP32 DevKit v1                |
                  |                                              |
[MT3608 5.05V]--->| [VIN]                                  [3V3] |---> DHT22 VCC, LDR VCC, SW-420 VCC
[Common GND]  --->| [GND]                                  [GND] |---> Common GND
                  |                                              |
                  | [GPIO 4]  <--- DHT22 Data (with 4.7k pull-up to 3.3V)
                  | [GPIO 16] <--- NEO-6M GPS TX (UART2 RX)
                  | [GPIO 17] ---> NEO-6M GPS RX (UART2 TX)
                  | [GPIO 25] ---> Low-Side N-MOSFET Gate (Peripheral Power Switch)
                  | [GPIO 27] <--- SW-420 Vibration DO (Hardware Interrupt, FALLING)
                  | [GPIO 34] <--- MQ-135 AOUT (via 10k/20k Voltage Divider from 5V)
                  | [GPIO 35] <--- GL5528 LDR Optical Tamper (with 10k pull-down to GND)
                  +----------------------------------------------+
```

---

## 3. Firmware Flashing (PlatformIO)

The edge firmware is located in [`hardware/esp32_firmware/src/main.cpp`](esp32_firmware/src/main.cpp).

1. Open `hardware/esp32_firmware/` in VS Code with PlatformIO.
2. In `src/main.cpp`, update mobile hotspot credentials and target FastAPI backend server IP:
   ```cpp
   const char* WIFI_SSID     = "AgriChain_Transit_Hotspot";
   const char* WIFI_PASSWORD = "ColdChain2026!";
   const char* FASTAPI_URL   = "http://<YOUR_LOCAL_IP>:8000/telemetry";
   ```
3. Flash and monitor:
   ```bash
   cd hardware/esp32_firmware
   pio run --target upload && pio device monitor
   ```

---

## 4. Hardware Simulation Runner

Run without physical hardware to test the entire ingestion pipeline:

```bash
# 1. Complete end-to-end demo (nominal + optical tamper + thermal breach + spoilage plume)
python hardware/simulate_esp32.py --mode demo

# 2. Simulate reefer compressor failure (48°C breach)
python hardware/simulate_esp32.py --mode fault

# 3. Simulate optical lid-open tamper breach (LDR > 150 lux)
python hardware/simulate_esp32.py --mode tamper

# 4. Simulate microbial rot VOC gas surge (MQ-135 > 50 ppm)
python hardware/simulate_esp32.py --mode spoilage

# 5. Continuous streaming telemetry
python hardware/simulate_esp32.py --mode stream --count 5
```
