@echo off
echo ================================================
echo    Logzee Shipment Tracking System Startup
echo ================================================
echo.

cd /d "%~dp0"

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found: 
node --version

echo.
echo Checking if dependencies are installed...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

echo.
echo ================================================
echo Starting Logzee Tracking Server...
echo ================================================
echo.
echo Server will be available at:
echo   Website: http://localhost:3000
echo   Tracking: http://localhost:3000/track
echo   API: http://localhost:3000/api
echo.
echo Sample tracking numbers:
echo   LZ2025001 (In Transit)
echo   LZ2025002 (Delivered)  
echo   LZ2025003 (Processing)
echo.
echo Press Ctrl+C to stop the server
echo ================================================
echo.

npm start
