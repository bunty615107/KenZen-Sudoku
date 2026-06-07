$ErrorActionPreference = 'Stop'

$sdkPath = "C:\Users\abhis\AppData\Local\Android\Sdk"
$cmdlineToolsPath = "$sdkPath\cmdline-tools"
$latestPath = "$cmdlineToolsPath\latest"
$zipPath = "$sdkPath\cmdline-tools.zip"

Write-Host "Creating SDK directories..."
New-Item -ItemType Directory -Force -Path $sdkPath | Out-Null
New-Item -ItemType Directory -Force -Path $cmdlineToolsPath | Out-Null

Write-Host "Downloading Android Command Line Tools..."
Invoke-WebRequest -Uri "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip" -OutFile $zipPath

Write-Host "Extracting tools..."
Expand-Archive -Path $zipPath -DestinationPath $cmdlineToolsPath -Force

Write-Host "Structuring cmdline-tools correctly..."
# The extracted folder is named 'cmdline-tools'. We need its contents inside 'latest'.
Rename-Item -Path "$cmdlineToolsPath\cmdline-tools" -NewName "latest" -Force

Write-Host "Accepting licenses and installing SDK packages..."
$sdkmanager = "$latestPath\bin\sdkmanager.bat"

# Automatically accept licenses by piping 'y' to the sdkmanager
cmd.exe /c "echo y| ""$sdkmanager"" --sdk_root=""$sdkPath"" ""platform-tools"" ""platforms;android-34"" ""build-tools;34.0.0"""

Write-Host "Cleaning up zip file..."
Remove-Item -Path $zipPath -Force

Write-Host "Android SDK successfully installed at $sdkPath!"
