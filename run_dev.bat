@echo off
title NEXORA AI - Development Launcher
echo ========================================================
echo        NEXORA AI - Starting Backend and Frontend
echo ========================================================
echo.

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "NEXORA AI - Backend" cmd /k "cd /d "%~dp0backend" && venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "NEXORA AI - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo NEXORA AI is launching!
echo Backend Docs:  http://127.0.0.1:8000/docs
echo Web Interface: http://localhost:5173
echo Login Email:   admin@nexora.ai
echo Password:      Admin@123
echo ========================================================
pause

