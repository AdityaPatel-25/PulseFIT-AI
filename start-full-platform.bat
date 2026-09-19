@echo off
title PulseFIT Full Platform Starter
echo ====================================================
echo   Launching PulseFIT AI Backend + Frontend
echo ====================================================
powershell -ExecutionPolicy Bypass -File "%~dp0run-all.ps1" -WithFrontend
pause
