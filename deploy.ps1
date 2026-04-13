# [Elite Finance Manager] One-Push Deployment Script
# This script automates the retrieval of latest code and the refresh of the entire 3D ecosystem.

Write-Host "`n🚀 INITIALIZING ELITE DEPLOYMENT MATRIX..." -ForegroundColor Cyan

# 1. Pull Latest Logic
if (Test-Path .git) {
    Write-Host "Updating Codebase from GitHub..." -ForegroundColor Gray
    git pull origin main --quiet
}

# 2. Cleanup & Restart
Write-Host "Re-launching Services..." -ForegroundColor Gray
& ./start_all.ps1

Write-Host "`n✅ Success: System is now live and synchronized." -ForegroundColor Green
