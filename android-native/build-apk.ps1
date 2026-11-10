$ErrorActionPreference = "Stop"

$sdkDir = "$env:LOCALAPPDATA\Android\Sdk"
$buildTools = "$sdkDir\build-tools\36.0.0"
$platformJar = "$sdkDir\platforms\android-36\android.jar"
$jdkBin = "C:\Program Files\Android\Android Studio\jbr\bin"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$jdkBin;$buildTools;$env:PATH"

$workDir = "c:\Users\savde\OneDrive\Desktop\Real-estate housing\android-native"
$buildDir = "$workDir\build"
if (Test-Path $buildDir) { Remove-Item -Recurse -Force $buildDir }
New-Item -ItemType Directory -Force -Path "$buildDir\compiled_res", "$buildDir\gen", "$buildDir\obj", "$buildDir\dex" | Out-Null

Write-Host "1. Compiling resources with aapt2..."
& "$buildTools\aapt2.exe" compile --dir "$workDir\res" -o "$buildDir\compiled_res\res.zip"

Write-Host "2. Linking resources and generating R.java..."
& "$buildTools\aapt2.exe" link `
  -o "$buildDir\unaligned.apk" `
  -I "$platformJar" `
  --manifest "$workDir\AndroidManifest.xml" `
  --java "$buildDir\gen" `
  "$buildDir\compiled_res\res.zip"

Write-Host "3. Compiling Java sources with javac..."
& "$jdkBin\javac.exe" -source 1.8 -target 1.8 `
  -bootclasspath "$platformJar" `
  -classpath "$platformJar" `
  -d "$buildDir\obj" `
  "$buildDir\gen\com\cribconnect\uniport\R.java" `
  "$workDir\src\com\cribconnect\uniport\MainActivity.java"

Write-Host "4. Converting classes to DEX with d8..."
$classFiles = Get-ChildItem -Recurse "$buildDir\obj" -Filter "*.class" | ForEach-Object { $_.FullName }
& "$buildTools\d8.bat" --lib "$platformJar" --output "$buildDir\dex" $classFiles

Write-Host "5. Adding classes.dex into APK..."
& "$jdkBin\jar.exe" uf "$buildDir\unaligned.apk" -C "$buildDir\dex" classes.dex

Write-Host "6. Aligning APK with zipalign..."
& "$buildTools\zipalign.exe" -f -p 4 "$buildDir\unaligned.apk" "$buildDir\aligned.apk"

Write-Host "7. Generating signing keystore and signing APK..."
$keystore = "$workDir\cribconnect-release.jks"
if (-not (Test-Path $keystore)) {
  & "$jdkBin\keytool.exe" -genkeypair `
    -keystore $keystore `
    -alias cribconnect `
    -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass cribconnect2026 -keypass cribconnect2026 `
    -dname "CN=CribConnect UNIPORT, OU=Mobile, O=CribConnect, L=Port Harcourt, ST=Rivers, C=NG"
}

$publicApk = "c:\Users\savde\OneDrive\Desktop\Real-estate housing\public\CribConnect.apk"
$desktopApk = "c:\Users\savde\OneDrive\Desktop\CribConnect.apk"
$rootApk = "c:\Users\savde\OneDrive\Desktop\Real-estate housing\CribConnect.apk"

& "$buildTools\apksigner.bat" sign `
  --ks $keystore `
  --ks-key-alias cribconnect `
  --ks-pass pass:cribconnect2026 `
  --key-pass pass:cribconnect2026 `
  --out $publicApk `
  "$buildDir\aligned.apk"

Copy-Item -Force $publicApk $desktopApk
Copy-Item -Force $publicApk $rootApk

Write-Host "SUCCESS! Signed APK generated at:"
Write-Host " - $publicApk"
Write-Host " - $desktopApk"
Write-Host " - $rootApk"
