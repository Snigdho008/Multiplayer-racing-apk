# Build script for Multiplayer 3D Racing Android APK
$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot
$buildDir = "$projectRoot\android-build"
$srcDir = "$buildDir\src\main"
$androidJar = "C:\tools\android-sdk\platforms\android-34\android.jar"
$aapt = "C:\tools\android-sdk\build-tools\34.0.0\aapt.exe"
$d8 = "C:\tools\android-sdk\build-tools\34.0.0\d8.bat"
$zipalign = "C:\tools\android-sdk\build-tools\34.0.0\zipalign.exe"
$apksigner = "C:\tools\android-sdk\build-tools\34.0.0\apksigner.bat"

$env:JAVA_HOME = "C:\tools\jdk\jdk-17.0.20.1+1"
$env:PATH = "$env:JAVA_HOME\bin;C:\tools\android-sdk\build-tools\34.0.0;C:\tools\android-sdk\platform-tools;$env:PATH"

$genDir = "$buildDir\gen"
$binDir = "$buildDir\bin"
$objDir = "$buildDir\obj"
New-Item -ItemType Directory -Force -Path $genDir, $binDir, $objDir | Out-Null

Write-Host "--> Step 1: Compiling resources..." -ForegroundColor Cyan
& $aapt package -f -m -J $genDir -M "$srcDir\AndroidManifest.xml" -S "$srcDir\res" -I $androidJar

Write-Host "--> Step 2: Compiling Java..." -ForegroundColor Cyan
$javaFiles = Get-ChildItem -Path "$srcDir\java", "$genDir" -Filter "*.java" -Recurse | Select-Object -ExpandProperty FullName
& javac -d $objDir -cp $androidJar $javaFiles

Write-Host "--> Step 3: D8 Dex generation..." -ForegroundColor Cyan
$classFiles = Get-ChildItem -Path $objDir -Filter "*.class" -Recurse | Select-Object -ExpandProperty FullName
& $d8 --output $binDir --lib $androidJar $classFiles

Write-Host "--> Step 4: Packaging APK..." -ForegroundColor Cyan
$unalignedApk = "$binDir\app-unaligned.apk"
& $aapt package -f -M "$srcDir\AndroidManifest.xml" -S "$srcDir\res" -A "$srcDir\assets" -I $androidJar -F $unalignedApk

Write-Host "--> Step 5: Adding DEX..." -ForegroundColor Cyan
Push-Location $binDir
& $aapt add $unalignedApk classes.dex
Pop-Location

Write-Host "--> Step 6: Zipalign..." -ForegroundColor Cyan
$alignedApk = "$binDir\app-aligned.apk"
& $zipalign -f -p 4 $unalignedApk $alignedApk

Write-Host "--> Step 7: Signing APK..." -ForegroundColor Cyan
$keystore = "$buildDir\debug.keystore"
$finalApk = "$projectRoot\MultiplayerRacing3D.apk"
& $apksigner sign --ks $keystore --ks-pass pass:android --key-pass pass:android --out $finalApk $alignedApk

Write-Host "--> Step 8: Verifying signature..." -ForegroundColor Cyan
& $apksigner verify --verbose $finalApk

Write-Host "`nSUCCESS! Generated signed APK at: $finalApk" -ForegroundColor Green
Get-Item $finalApk | Select-Object Name, Length, LastWriteTime

