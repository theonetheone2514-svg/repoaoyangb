@echo off
echo ==========================================
echo  Starting Live Server for Aoyangbo Shop
echo ==========================================
echo.
echo Make sure you have Node.js installed!
echo.

REM Check if npx is available
where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing live-server...
    npm install -g live-server
)

echo Starting server at http://localhost:8080
echo.
live-server --port=8080 --open=aoyangbo-shop.html

pause
