@echo off
setlocal enabledelayedexpansion
title FitSync AI - Unified Fitness Platform (Port 8080)
color 0B

echo ===============================================================================
echo                FITSYNC AI - UNIFIED FITNESS MANAGEMENT PLATFORM
echo                           Single Port 8080 Launcher
echo ===============================================================================
 echo(

cd /d "%~dp0"

REM 1. Detect PHP Binary
set "PHP_BIN="
if exist "C:\xampp\php\php.exe" (
    set "PHP_BIN=C:\xampp\php\php.exe"
) else if exist "D:\xampp\php\php.exe" (
    set "PHP_BIN=D:\xampp\php\php.exe"
) else (
    where php >NUL 2>&1
    if not errorlevel 1 set "PHP_BIN=php"
)

if "%PHP_BIN%"=="" (
    color 0C
    echo [ERROR] PHP executable was not found on your system!
    echo         Please install PHP or XAMPP at C:\xampp\php\php.exe to continue.
    echo(
    pause
    exit /b 1
)
echo [OK] Using PHP: %PHP_BIN%

REM 2. Ensure MySQL Database Service is Running
tasklist /fi "imagename eq mysqld.exe" 2>NUL | find /i "mysqld.exe" >NUL
if errorlevel 1 (
    echo [*] MySQL is not running. Attempting to start MySQL engine...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start /b "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >NUL
    ) else if exist "D:\xampp\mysql\bin\mysqld.exe" (
        start /b "" "D:\xampp\mysql\bin\mysqld.exe" --defaults-file="D:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >NUL
    )
    tasklist /fi "imagename eq mysqld.exe" 2>NUL | find /i "mysqld.exe" >NUL
    if errorlevel 1 (
        echo [WARNING] Could not automatically start MySQL. If your database requires
        echo           manual startup, please ensure MySQL is running on port 3306.
    ) else (
        echo [OK] MySQL Service started successfully.
    )
) else (
    echo [OK] MySQL Service is active and running.
)

REM 3. Display Portal Access URLs
echo(
echo ===============================================================================
echo   Portals Ready on Unified Port 8080:
echo(
echo   [1] Member Portal:      http://localhost:8080/index.html
echo   [2] Trainer Portal:     http://localhost:8080/trainer/index.html
echo   [3] Gym Owner Portal:   http://localhost:8080/gym_owner/index.html
echo   [4] Primary Gateway:    http://localhost:8080/
echo ===============================================================================
echo(
echo [*] Launching browser at http://localhost:8080/index.html in 2 seconds...

start "" cmd /c "timeout /t 2 /nobreak >NUL & start http://localhost:8080/index.html"

echo [*] Starting PHP Development Server on 127.0.0.1:8080...
echo     Press Ctrl+C to stop the platform.
echo ===============================================================================
echo(

"%PHP_BIN%" -S 127.0.0.1:8080
if errorlevel 1 (
    echo(
    echo [!] Server terminated or port 8080 is currently occupied.
    echo     Please check if another PHP process is running on port 8080.
)

pause
