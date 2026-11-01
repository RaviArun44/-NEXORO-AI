@echo off
title Khaira AI Voice Automation Platform - Development Launcher
echo ========================================================
echo   Khaira AI Voice Automation Platform - Launcher
echo ========================================================
echo.

set "TARGET_DIR=%~dp0"
if exist "%~dp0NEXORO AI\backend" set "TARGET_DIR=%~dp0NEXORO AI\"

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Khaira AI - Backend" cmd /k "cd /d "%TARGET_DIR%backend" && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "Khaira AI - Frontend" cmd /k "cd /d "%TARGET_DIR%frontend" && npm run dev"

echo.
echo ========================================================
echo Khaira AI Voice Automation Platform is launching!
echo Backend Docs:  http://127.0.0.1:8000/docs
echo Web Interface: http://localhost:5173
echo Login Email:   admin@khairacompany.com (or admin@nexora.ai)
echo Password:      Admin@123
echo ========================================================
