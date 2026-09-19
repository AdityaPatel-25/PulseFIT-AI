@echo off
title PulseFIT Frontend Dashboard
echo ====================================================
echo      Starting PulseFIT AI Frontend Dashboard
echo ====================================================
cd /d "%~dp0frontend"
npm run dev
pause
