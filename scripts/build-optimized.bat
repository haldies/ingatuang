@echo off
REM Build Optimized APK Script for Windows
REM This script builds the smallest possible APK for production

echo.
echo ========================================
echo Building Optimized APK for IngatUang
echo ========================================
echo.

REM Step 1: Clean previous builds
echo Step 1: Cleaning previous builds...
cd android
call gradlew clean
cd ..
echo [OK] Clean complete
echo.

REM Step 2: Build release APK (arm64-v8a only)
echo Step 2: Building release APK (arm64-v8a only)...
echo This may take 5-10 minutes...
cd android
call gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
cd ..
echo [OK] Build complete
echo.

REM Step 3: Show APK info
echo Step 3: APK Information
set APK_PATH=android\app\build\outputs\apk\release\app-release.apk

if exist "%APK_PATH%" (
    echo [OK] APK created successfully!
    echo.
    echo APK Location:
    echo    %APK_PATH%
    echo.
    echo APK Size:
    dir "%APK_PATH%" | find "app-release.apk"
    echo.
    echo Target Architecture: arm64-v8a (64-bit ARM)
    echo Compatible with: Most modern Android devices (2019+)
    echo.
    echo Next steps:
    echo 1. Test on real device: adb install %APK_PATH%
    echo 2. Or copy to device and install manually
    echo.
) else (
    echo [WARNING] APK not found. Build may have failed.
    echo Check the error messages above.
)

pause
