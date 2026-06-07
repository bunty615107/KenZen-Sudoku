# Build script for KenZen Sudoku APK
$ErrorActionPreference = 'Stop'

# Define paths for tools found on this system
$javaPath = "C:\Users\abhis\.antigravity\extensions\redhat.java-1.54.0-win32-x64\jre\21.0.10-win32-x86_64"
$nodePath = "C:\Users\abhis\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$sdkPath = "C:\Users\abhis\AppData\Local\Android\Sdk"

# Set environment variables for this session
$env:JAVA_HOME = $javaPath
$env:ANDROID_HOME = $sdkPath
$env:Path = "$javaPath\bin;$nodePath;" + $env:Path

Write-Host "--- Starting KenZen Sudoku Build ---" -ForegroundColor Cyan

# 1. Generate JS Bundle (Required for release/clean builds)
Write-Host "Step 1: Generating JavaScript bundle..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "android/app/src/main/assets" | Out-Null
& node node_modules/react-native/cli.js bundle `
    --platform android `
    --dev false `
    --entry-file index.js `
    --bundle-output android/app/src/main/assets/index.android.bundle `
    --assets-dest android/app/src/main/res

# 2. Run Gradle Build
Write-Host "Step 2: Compiling APK with Gradle..." -ForegroundColor Yellow
cd android
.\gradlew.bat assembleDebug --no-daemon

Write-Host "`nSUCCESS! APK generated at:" -ForegroundColor Green
Write-Host "d:\KenZen Sudoku\app\android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
