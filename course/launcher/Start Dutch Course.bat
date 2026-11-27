@echo off
rem Double-click me to open the Dutch course with a working microphone.
cd /d "%~dp0"
start "Dutch course" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0assets\serve.ps1" -Root "%~dp0."
