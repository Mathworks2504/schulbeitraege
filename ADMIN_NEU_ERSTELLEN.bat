@echo off
cd /d "%~dp0"
node admin-neu.js
if errorlevel 1 (pause & exit /b 1)
echo Zugangsdaten jetzt notieren.
pause
node install.js
