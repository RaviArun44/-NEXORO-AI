# NEXORO AI - PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   NEXORO AI - Multilingual Receptionist & Enterprise   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

if (Test-Path (Join-Path $PSScriptRoot "NEXORO AI\backend")) {
    $backendDir = Join-Path $PSScriptRoot "NEXORO AI\backend"
    $frontendDir = Join-Path $PSScriptRoot "NEXORO AI\frontend"
} else {
    $backendDir = Join-Path $PSScriptRoot "backend"
    $frontendDir = Join-Path $PSScriptRoot "frontend"
}

Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting React Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev -- --host 0.0.0.0 --port 5173"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "NEXORO AI Platform is running!" -ForegroundColor Green
Write-Host "Web Application:     http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API Docs:    http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "Android / Mobile:    http://<your-local-ip>:5173" -ForegroundColor Yellow
Write-Host "`nRole Portals & Demo Accounts:" -ForegroundColor White
Write-Host "- Customer Portal:   9876543210 / customer" -ForegroundColor White
Write-Host "- Agent Desk:        agent / Agent@123" -ForegroundColor White
Write-Host "- Admin Suite:       admin / Admin@123" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
