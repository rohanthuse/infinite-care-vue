@echo off
REM Infinite Care Carer - APK Build Script (Windows)
REM This script automates the entire APK build process

echo ================================================
echo   Infinite Care Carer - APK Build Script
echo ================================================
echo.

REM Check if we're in the right directory
if not exist "capacitor.config.ts" (
    echo Error: Please run this script from the project root directory
    exit /b 1
)

REM Step 1: Install dependencies
echo Step 1/5: Installing Node dependencies...
if not exist "node_modules" (
    call npm install
) else (
    echo Dependencies already installed
)
echo.

REM Step 2: Build web app
echo Step 2/5: Building React web app...
call npm run build
if errorlevel 1 (
    echo Error: Web app build failed
    exit /b 1
)
echo Web app built successfully
echo.

REM Step 3: Sync to Android
echo Step 3/5: Syncing to Android platform...
call npx cap sync android
if errorlevel 1 (
    echo Error: Capacitor sync failed
    exit /b 1
)
echo Synced to Android
echo.

REM Step 4: Build APK
echo Step 4/5: Building Android APK...
cd android

REM Build debug APK
call gradlew.bat assembleDebug --no-daemon
if errorlevel 1 (
    echo Error: APK build failed
    cd ..
    exit /b 1
)

cd ..

echo APK built successfully!
echo.

REM Step 5: Show results
echo Step 5/5: Locating APK...
set APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk

if exist "%APK_PATH%" (
    echo ================================================
    echo   BUILD SUCCESSFUL!
    echo ================================================
    echo.
    echo APK Location: %APK_PATH%
    echo.
    echo To install on a connected device:
    echo   adb install %APK_PATH%
    echo.
    echo Or copy the APK to your phone and install manually.
    echo.
) else (
    echo Error: APK not found at expected location
    exit /b 1
)

echo Done!
pause
