@echo off
setlocal enabledelayedexpansion
title Pushing to GitHub - RaviArun44/-NEXORO-AI
cd /d "%~dp0"
set "PATH=C:\Users\dell\minigit\cmd;C:\Users\dell\minigit\mingw64\bin;%PATH%"

echo ====================================================================
echo   KHAIRO AI / NEXORO AI - PUSH TO GITHUB
echo   Repository: https://github.com/RaviArun44/-NEXORO-AI.git
echo   Branch:     main
echo ====================================================================
echo.

git push -u origin main

if !ERRORLEVEL! EQU 0 (
    echo.
    echo ====================================================================
    echo   [SUCCESS] Code successfully pushed to GitHub!
    echo   Link: https://github.com/RaviArun44/-NEXORO-AI
    echo ====================================================================
) else (
    echo.
    echo ====================================================================
    echo   [NOTICE] If GitHub requested authentication, please sign in via
    echo   the browser prompt or provide a Personal Access Token (PAT).
    echo ====================================================================
)
echo.
pause
