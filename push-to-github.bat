@echo off
setlocal enabledelayedexpansion
title GitHub Auto Push Tool - MY ECOMMERCE WEBSITE
cls

echo ===================================================
echo        MY ECOMMERCE WEBSITE - GITHUB AUTO PUSH
echo ===================================================
echo.

:: 1. Check if Git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git install nahi hai.
    pause
    exit /b 1
)

:: 2. Set default identity if missing
git config user.name >nul 2>nul
if %errorlevel% neq 0 (
    git config --global user.name "RollPoint Admin"
    git config --global user.email "admin@rollpoint.pk"
)

:: 3. Check if Git repo initialized
if not exist ".git" (
    echo [INFO] Initializing Git repository...
    git init
    git branch -M main
)

:: 4. Check & fix Remote URL
set CURRENT_URL=
for /f "tokens=*" %%u in ('git remote get-url origin 2^>nul') do set CURRENT_URL=%%u

echo !CURRENT_URL! | findstr /i "AapkaUsername" >nul
if %errorlevel% equ 0 (
    set CURRENT_URL=
)

if "!CURRENT_URL!"=="" (
    echo [IMPORTANT] Sahi GitHub Repository URL enter karein:
    echo (Example: https://github.com/myaccount/print-roll.git)
    echo.
    set /p REPO_URL="GitHub URL: "
    if "!REPO_URL!"=="" (
        echo [ERROR] URL enter nahi kiya gaya.
        pause
        exit /b 1
    )
    git remote remove origin >nul 2>nul
    git remote add origin !REPO_URL!
    echo [OK] Remote URL set: !REPO_URL!
    echo.
) else (
    echo Target GitHub Repository: !CURRENT_URL!
    echo.
)

:: 5. Status
echo ---------------------------------------------------
echo Changes status:
git status -s
echo ---------------------------------------------------
echo.

:: 6. Commit Message
set /p COMMIT_MSG="Commit message likhein (Enter dabane par Auto-Update message lagega): "
if "!COMMIT_MSG!"=="" (
    for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (set MYDATE=%%a-%%b-%%c)
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set MYTIME=%%a:%%b)
    set COMMIT_MSG=Auto update on !MYDATE! at !MYTIME!
)

echo.
echo [1/3] Files stage ho rahi hain...
git add -A

echo [2/3] Changes save (commit) ho rahi hain...
git commit -m "!COMMIT_MSG!"

echo [3/3] GitHub par push ho raha hai...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo    SUCCESS: Sabhi changes GitHub par push ho gayin!
    echo ===================================================
) else (
    echo.
    echo ===================================================
    echo    [NOTE] Agar pehli baar hai, toh browser/window me
    echo    GitHub se Login (Sign in) karne ka option aayega.
    echo    Login karne ke baad code push ho jayega!
    echo ===================================================
)

echo.
pause
