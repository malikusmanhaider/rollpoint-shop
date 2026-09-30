@echo off
title RollsPoint E-Commerce Server
echo =====================================================
echo Starting RollsPoint E-Commerce Website Server...
echo =====================================================
cd /d "%~dp0"
start http://localhost:5000
node server.js
pause
