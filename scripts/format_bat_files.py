import os

content_main = r"""@echo off
setlocal enabledelayedexpansion
title FitSync AI - Unified Fitness Platform (Port 8080)
color 0B

echo ===============================================================================
echo                FITSYNC AI - UNIFIED FITNESS MANAGEMENT PLATFORM
echo                           Single Port 8080 Launcher
echo ===============================================================================
echo(

cd /d "%~dp0"

REM 1. Ensure .env Configuration Exists (for fresh clones)
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
    echo [ERROR] PHP executable was not found on your system!
    echo         Please install PHP or XAMPP at C:\xampp\php\php.exe to continue.
    echo(
    pause
    exit /b 1
)
echo [OK] Using PHP: %PHP_BIN%

REM 3. Ensure MySQL Database Service is Running
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

REM 4. Auto-Initialize fitsync_db Schema on First Run (if missing)
set "MYSQL_BIN="
if exist "C:\xampp\mysql\bin\mysql.exe" (
    set "MYSQL_BIN=C:\xampp\mysql\bin\mysql.exe"
) else if exist "D:\xampp\mysql\bin\mysql.exe" (
    set "MYSQL_BIN=D:\xampp\mysql\bin\mysql.exe"
) else (
    where mysql >NUL 2>&1
    if not errorlevel 1 set "MYSQL_BIN=mysql"
)

if not "%MYSQL_BIN%"=="" (
    tasklist /fi "imagename eq mysqld.exe" 2>NUL | find /i "mysqld.exe" >NUL
    if not errorlevel 1 (
        "%MYSQL_BIN%" -u root -e "USE fitsync_db;" >NUL 2>&1
        if errorlevel 1 (
            set "SCHEMA_FILE="
            if exist "database\fitsync_mysql_schema.sql" set "SCHEMA_FILE=database\fitsync_mysql_schema.sql"
            if "!SCHEMA_FILE!"=="" if exist "..\database\fitsync_mysql_schema.sql" set "SCHEMA_FILE=..\database\fitsync_mysql_schema.sql"
            if not "!SCHEMA_FILE!"=="" (
                echo [*] Database 'fitsync_db' not found. Importing !SCHEMA_FILE!...
                "%MYSQL_BIN%" -u root < "!SCHEMA_FILE!" >NUL 2>&1
                if not errorlevel 1 (
                    echo [OK] Database 'fitsync_db' initialized successfully.
                ) else (
                    echo [WARNING] Automatic schema import failed. Please import !SCHEMA_FILE! manually.
                )
            )
        ) else (
            echo [OK] Database 'fitsync_db' verified.
        )
    )
)

REM 5. Display Portal Access URLs
echo(
echo ===============================================================================
echo   Portals Ready on Unified Port 8080:
echo(
echo   [1] Login / Register:   http://localhost:8080/login.php
echo   [2] Member Portal:      http://localhost:8080/index.html
echo   [3] Trainer Portal:     http://localhost:8080/trainer/index.html
echo   [4] Gym Owner Portal:   http://localhost:8080/gym_owner/index.html
echo   [5] Admin Portal:       http://localhost:8080/admin/index.html
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
"""

content_php = r"""@echo off
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
"""

crlf_main = content_main.replace('\r\n', '\n').replace('\n', '\r\n')
crlf_php = content_php.replace('\r\n', '\n').replace('\n', '\r\n')

for path in ['start_fitsync.bat', 'fitsync/start_fitsync.bat']:
    with open(path, 'wb') as f:
        f.write(crlf_main.encode('ascii'))
    print(f"Written {path}")

for path in ['start_fitsync_php.bat', 'fitsync/start_fitsync_php.bat']:
    with open(path, 'wb') as f:
        f.write(crlf_php.encode('ascii'))
    print(f"Written {path}")
