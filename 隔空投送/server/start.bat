@echo off
chcp 65001 >nul
title AirShare Server

echo ===============================
echo   AirShare - Server
echo ===============================

:: Check Python
py -3 --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found! Install from https://python.org
    pause
    exit /b 1
)

echo [INFO] Installing dependencies...
py -3 -m pip install aiohttp qrcode pillow --quiet

echo [INFO] Starting server...
py -3 server.py

pause