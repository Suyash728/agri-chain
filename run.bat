@echo off
rem ==============================================================================
rem AgriChain Full-Stack Runner (Windows Command Prompt)
rem Usage: run.bat [--no-browser] [--simulator] [--no-seed] [--kill-ports]
rem ==============================================================================

chcp 65001 >nul
cd /d "%~dp0"

set "PROJECT_DIR=%~dp0"
set "PYTHON_EXEC="

if exist "%PROJECT_DIR%.venv\Scripts\python.exe" (
    set "PYTHON_EXEC=%PROJECT_DIR%.venv\Scripts\python.exe"
) else if exist "%PROJECT_DIR%venv\Scripts\python.exe" (
    set "PYTHON_EXEC=%PROJECT_DIR%venv\Scripts\python.exe"
) else (
    where python >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        set "PYTHON_EXEC=python"
    ) else (
        where py >nul 2>nul
        if %ERRORLEVEL% equ 0 (
            set "PYTHON_EXEC=py"
        )
    )
)

if "%PYTHON_EXEC%"=="" (
    echo [ERROR] Python 3 was not detected in .venv or PATH.
    echo Please install Python 3 or activate your virtual environment.
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js was not detected in PATH.
    echo Please ensure Node.js is installed to run Hardhat and Vite.
    pause
    exit /b 1
)

"%PYTHON_EXEC%" "%PROJECT_DIR%run.py" %*
