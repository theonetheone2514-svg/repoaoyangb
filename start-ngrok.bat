@echo off
echo ==========================================
echo  Start Ngrok Tunnel for Aoyangbo Shop
echo ==========================================
echo.
echo This will create a public URL to your local site
echo.

REM Check if ngrok exists
if not exist "ngrok.exe" (
    echo ==========================================
    echo  ERROR: ngrok.exe not found!
    echo ==========================================
    echo.
    echo Please download ngrok from: https://ngrok.com/download
    echo.
    echo 1. Sign up at https://ngrok.com (free)
    echo 2. Download ngrok.exe
    echo 3. Put ngrok.exe in this folder: C:\Users\THEONE\webTEA\
    echo 4. Run: ngrok config add-authtoken YOUR_TOKEN
    echo.
    pause
    exit
)

echo Starting local server on port 8080...
start /b cmd /c "npx live-server --port=8080 --no-browser"

timeout /t 3 >nul

echo.
echo Starting ngrok tunnel...
echo.
ngrok http 8080

pause
