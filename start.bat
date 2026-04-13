@echo off
echo ===================================================
echo Family Finance Manager - Automated Deployment
echo ===================================================
echo.
echo Starting system... Initializing Tunnels and Services.
echo.

powershell -ExecutionPolicy Bypass -File "start_all.ps1"

pause
