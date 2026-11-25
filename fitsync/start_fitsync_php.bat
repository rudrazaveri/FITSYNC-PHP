@echo off
setlocal enabledelayedexpansion
title FitSync AI - PHP Backend Service (Port 8080)
color 0A

echo ===============================================================================
echo                FITSYNC AI - PHP BACKEND SERVER (PORT 8080)
echo ===============================================================================
echo(

cd /d "%~dp0"

REM 1. Ensure .env Configuration Exists
if not exist ".env" (
    if exist ".env.example" (
        copy /Y ".env.example" ".env" >NUL
        echo [OK] Created .env from .env.example
    )
)

REM 2. Detect PHP Binary
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
    echo [ERROR] PHP executable not found!
    echo         Please install PHP or XAMPP at C:\xampp\php\php.exe to continue.
    pause
    exit /b 1
)

echo [OK] PHP Executable : %PHP_BIN%
"%PHP_BIN%" -v | findstr /i "PHP"
echo(

REM 3. Check MySQL Database Engine
tasklist /fi "imagename eq mysqld.exe" 2>NUL | find /i "mysqld.exe" >NUL
if errorlevel 1 (
    echo [WARNING] MySQL is not currently running. API database requests may fail.
    echo           Please ensure MySQL is running on 127.0.0.1:3306.
) else (
    echo [OK] MySQL Service is active.
)

echo(
echo ===============================================================================
echo   Serving FitSync AI on http://127.0.0.1:8080
echo   - Login / Register:  http://localhost:8080/login.php
echo   - Member Portal:     http://localhost:8080/index.html
echo   - Trainer Portal:    http://localhost:8080/trainer/index.html
echo   - Gym Owner Portal:  http://localhost:8080/gym_owner/index.html
echo   - Admin Portal:      http://localhost:8080/admin/index.html
echo(
echo   Press Ctrl+C to terminate the PHP server.
echo ===============================================================================
echo(

"%PHP_BIN%" -S 127.0.0.1:8080
pause
