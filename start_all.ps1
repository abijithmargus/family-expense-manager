# Stop any existing processes on the project ports (8000 for BE, 5173 for FE)
Write-Host "Cleaning up existing processes..." -ForegroundColor Gray
$ports = @(8000, 5173, 4040)
foreach ($port in $ports) {
    $procId = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
    if ($procId) { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue }
}
# Also kill common process names just in case
Get-Process | Where-Object { $_.Name -match "uvicorn|node|cloudflared|ngrok" } | Stop-Process -Force -ErrorAction SilentlyContinue

$RootPath = Get-Location
$AxiosPath = "$RootPath\FE\src\services\axios.js"
$CfLog = "$RootPath\cloudflared.log"

# 1. Start Backend in a new window
Write-Host "Starting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd BE; .\venv\Scripts\activate; uvicorn app.main:app --host 0.0.0.0 --port 8000"

# 2. Start Cloudflared for Frontend (Port 5173) and capture URL
Write-Host "Initializing Cloudflare Tunnel for UI..." -ForegroundColor Cyan
if (Test-Path $CfLog) { Remove-Item $CfLog }
Start-Process ".\cloudflared.exe" -ArgumentList "tunnel", "--url", "http://localhost:5173" -RedirectStandardError $CfLog

Write-Host "Waiting for Cloudflare UI URL..." -NoNewline
$cfUrl = ""
for ($i = 0; $i -lt 30; $i++) {
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 1
    if (Test-Path $CfLog) {
        $content = Get-Content $CfLog -Raw
        if ($content -match "https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
            $cfUrl = $Matches[0]
            break
        }
    }
}
Write-Host ""

if (-not $cfUrl) {
    Write-Host "Error: Could not capture Cloudflare URL." -ForegroundColor Red
} else {
    Write-Host "Cloudflare UI URL Captured: $cfUrl" -ForegroundColor Green
}

# 3. Start Ngrok for Backend (Port 8000)
Write-Host "Initializing Ngrok Tunnel for API..." -ForegroundColor Cyan
Start-Process ".\ngrok.exe" -ArgumentList "http", "8000"
Start-Sleep -Seconds 7 # Allow Ngrok more time locally

$ngrokUrl = ""
try {
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
    $ngrokUrl = $tunnels.tunnels[0].public_url
} catch {
    Write-Host "Error: Could not capture Ngrok API URL." -ForegroundColor Red
}

if ($ngrokUrl) {
    Write-Host "Ngrok API URL Captured: $ngrokUrl" -ForegroundColor Green
    
    # 4. Update Frontend Axios Config with the Backend's Tunnel URL
    Write-Host "Syncing Frontend with API Tunnel..." -ForegroundColor Cyan
    (Get-Content $AxiosPath) -replace "baseURL: '.*'", "baseURL: '$ngrokUrl/api/v1'" | Set-Content $AxiosPath
    Write-Host "axios.js updated to use Ngrok endpoint." -ForegroundColor Green
}

# 5. Start Frontend
Write-Host "Starting Frontend (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd FE; npm run dev"

# 6. Launch the Experience
if ($cfUrl) {
    Write-Host "Launching Cinematic Dashboard..." -ForegroundColor Cyan
    # Small delay to ensure Vite is ready
    Start-Sleep -Seconds 3
    Start-Process "chrome.exe" -ArgumentList $cfUrl
}

Write-Host "Elite Deployment Matrix Active!" -ForegroundColor Green


