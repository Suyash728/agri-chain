#!/usr/bin/env bash
# ==============================================================================
# AgriChain Full-Stack Runner (Linux & macOS)
# Usage: ./run.sh [--no-browser] [--simulator] [--no-seed] [--kill-ports]
# ==============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Locate Python in virtual environment or fallback to system python3
if [ -f "$PROJECT_DIR/.venv/bin/python" ]; then
    PYTHON_EXEC="$PROJECT_DIR/.venv/bin/python"
elif [ -f "$PROJECT_DIR/venv/bin/python" ]; then
    PYTHON_EXEC="$PROJECT_DIR/venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_EXEC="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_EXEC="python"
else
    echo "[!] Error: Python 3 is not installed or not in PATH."
    exit 1
fi

# Check Node / npm
if ! command -v node >/dev/null 2>&1; then
    echo "[!] Error: Node.js is required but not installed or not in PATH."
    exit 1
fi

exec "$PYTHON_EXEC" "$PROJECT_DIR/run.py" "$@"
