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

:: 2. Target info
for /f "tokens=*" %%u in ('git remote get-url origin 2^>nul') do set CURRENT_URL=%%u
echo Target GitHub Repository: !CURRENT_URL!
echo.

:: 3. Status
echo ---------------------------------------------------
echo Changes status:
git status -s
echo ---------------------------------------------------
echo.

:: 4. Commit Message
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
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo ===================================================
    echo    SUCCESS: Sabhi changes GitHub par push ho gayin!
    echo ===================================================
) else (
    echo.
    echo [INFO] Normal push me masla aaya, syncing with remote...
    git push -u origin main --force
    if !errorlevel! equ 0 (
        echo.
        echo ===================================================
        echo    SUCCESS: Sabhi changes GitHub par push ho gayin!
        echo ===================================================
    ) else (
        echo.
        echo ===================================================
        echo    [ERROR] Push nahi ho saka. Internet ya login check karein.
        echo ===================================================
    )
)

echo.
pause
