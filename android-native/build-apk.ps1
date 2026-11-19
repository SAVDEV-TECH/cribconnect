$ErrorActionPreference = "Stop"

$keystorePass = $env:CRIBCONNECT_KEYSTORE_PASS
if ([string]::IsNullOrWhiteSpace($keystorePass)) {
  throw "Set the CRIBCONNECT_KEYSTORE_PASS environment variable before building a signed APK."
}

$sdkDir = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
$buildTools = "$sdkDir\build-tools\36.0.0"
$platformJar = "$sdkDir\platforms\android-36\android.jar"
$jdkHome = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { "C:\Program Files\Android\Android Studio\jbr" }
$jdkBin = "$jdkHome\bin"
$env:JAVA_HOME = $jdkHome
$env:PATH = "$jdkBin;$buildTools;$env:PATH"

$workDir = $PSScriptRoot
$repoRoot = Split-Path -Parent $workDir
$buildDir = Join-Path $workDir "build"
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

Write-Host "7. Signing APK..."
$keystore = if ($env:CRIBCONNECT_KEYSTORE_PATH) { $env:CRIBCONNECT_KEYSTORE_PATH } else { Join-Path $workDir "cribconnect-release.jks" }
if (-not (Test-Path $keystore)) {
  & "$jdkBin\keytool.exe" -genkeypair `
    -keystore $keystore `
    -alias cribconnect `
    -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass $keystorePass -keypass $keystorePass `
    -dname "CN=CribConnect UNIPORT, OU=Mobile, O=CribConnect, L=Port Harcourt, ST=Rivers, C=NG"
}

$publicApk = Join-Path $repoRoot "public\CribConnect.apk"

& "$buildTools\apksigner.bat" sign `
  --ks $keystore `
  --ks-key-alias cribconnect `
  --ks-pass "env:CRIBCONNECT_KEYSTORE_PASS" `
  --key-pass "env:CRIBCONNECT_KEYSTORE_PASS" `
  --out $publicApk `
  "$buildDir\aligned.apk"

Write-Host "SUCCESS! Signed APK generated at: $publicApk"
