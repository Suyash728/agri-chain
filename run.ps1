# ==============================================================================
# AgriChain Full-Stack Runner (PowerShell for Windows, macOS, Linux)
# Usage: .\run.ps1 [-NoBrowser] [-Simulator] [-NoSeed] [-KillPorts]
# ==============================================================================

[CmdletBinding()]
param(
    [switch]$NoBrowser,
    [switch]$Simulator,
    [switch]$NoSeed,
    [switch]$KillPorts
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# Output UTF-8 encoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$PythonExec = $null
$WindowsVenv = Join-Path $ScriptDir ".venv\Scripts\python.exe"
$UnixVenv = Join-Path $ScriptDir ".venv/bin/python"
$VenvFallback = Join-Path $ScriptDir "venv\Scripts\python.exe"

if (Test-Path $WindowsVenv) {
    $PythonExec = $WindowsVenv
} elseif (Test-Path $UnixVenv) {
    $PythonExec = $UnixVenv
} elseif (Test-Path $VenvFallback) {
    $PythonExec = $VenvFallback
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $PythonExec = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $PythonExec = "python3"
}

if (-not $PythonExec) {
    Write-Host "[ERROR] Python 3 executable not found in .venv or PATH." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js was not detected in PATH. Required for Hardhat & Vite." -ForegroundColor Red
    exit 1
}

$PyArgs = @()
if ($NoBrowser) { $PyArgs += "--no-browser" }
if ($Simulator) { $PyArgs += "--simulator" }
if ($NoSeed) { $PyArgs += "--no-seed" }
if ($KillPorts) { $PyArgs += "--kill-ports" }

# Append any remaining raw arguments
$PyArgs += $args

$RunScript = Join-Path $ScriptDir "run.py"
& $PythonExec $RunScript @PyArgs
