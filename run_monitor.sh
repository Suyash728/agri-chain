#!/usr/bin/env bash
# ==============================================================================
# AgriChain 7-Subsystem IoT Edge Node Live Telemetry Mission Control
# Usage: ./run_monitor.sh [--skip-sync] [--clear] [--batch BAT-MGO-701]
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

VENV_PYTHON="$PROJECT_DIR/.venv/bin/python"
MONITOR_SCRIPT="$PROJECT_DIR/hardware/monitor_live.py"

if [ ! -f "$VENV_PYTHON" ]; then
    echo "[!] Error: Virtual environment python not found at $VENV_PYTHON"
    exit 1
fi

if [ ! -e "/dev/ttyUSB0" ]; then
    echo "[!] Warning: /dev/ttyUSB0 not detected! Please ensure ESP32 is plugged in via USB."
    echo "    Checking available serial ports..."
    ls -l /dev/ttyUSB* /dev/ttyACM* 2>/dev/null || echo "    No serial USB devices found."
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "========================================================"
echo "  🚚 Starting AgriChain Edge Telemetry & LittleFS Sync Control...    "
echo "  Target: ESP32 on /dev/ttyUSB0 (115200 baud)           "
echo "  Refresh: 1000ms Real-Time Pulse                       "
echo "========================================================"

exec "$VENV_PYTHON" "$MONITOR_SCRIPT" "$@"
