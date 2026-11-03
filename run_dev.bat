@echo off
title NEXORO AI - Development Launcher
echo ========================================================
echo   NEXORO AI - Multilingual Receptionist & Enterprise Platform
echo ========================================================
echo.

set "TARGET_DIR=%~dp0"
if exist "%~dp0NEXORO AI\backend" set "TARGET_DIR=%~dp0NEXORO AI\"

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "NEXORO AI - Backend" cmd /k "cd /d "%TARGET_DIR%backend" && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "NEXORO AI - Frontend" cmd /k "cd /d "%TARGET_DIR%frontend" && npm run dev -- --host 0.0.0.0 --port 5173"

echo.
echo ========================================================
echo NEXORO AI Platform is launching!
echo Backend Docs:     http://127.0.0.1:8000/docs
echo Web Interface:    http://localhost:5173
echo Android / Mobile: http://<your-local-ip>:5173
echo.
echo Role Portals & Demo Accounts:
echo - Customer Portal: 9876543210 / customer (or registered username/mobile)
echo - Agent Console:   agent / Agent@123 (or agent / agent)
echo - Admin Suite:     admin / Admin@123 (or admin / admin)
echo ========================================================
