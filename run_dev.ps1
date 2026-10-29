# NEXORA AI - PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       NEXORA AI - Starting Backend and Frontend        " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "backend"
$frontendDir = Join-Path $PSScriptRoot "frontend"

Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; .\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting React Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "NEXORA AI is running!" -ForegroundColor Green
Write-Host "Web Application: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API:     http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "Login Email:     admin@nexora.ai" -ForegroundColor White
Write-Host "Login Password:  Admin@123" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan

