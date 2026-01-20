# How to Build Your APK - Complete Guide

This guide will help you build a fully functional APK that you can install on any Android device.

## 🚀 Quick Build (3 Simple Steps)

### Prerequisites
- ✅ Internet connection (to download dependencies)
- ✅ Node.js 18+ installed
- ✅ Git (to clone the repository)

### Option A: Automated Build (Recommended)

**On Linux/Mac:**
```bash
# 1. Clone/pull the repository
git pull origin claude/android-carer-app-joYP4

# 2. Make script executable
chmod +x build-apk.sh

# 3. Run the build script
./build-apk.sh
```

**On Windows:**
```cmd
REM 1. Clone/pull the repository
git pull origin claude/android-carer-app-joYP4

REM 2. Run the build script
build-apk.bat
```

That's it! The script will:
1. Install Node dependencies
2. Build the React web app
3. Sync to Android platform
4. Build the APK
5. Show you where the APK is located

**APK Location:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Option B: Manual Build

If you prefer to run commands manually:

```bash
# Step 1: Install dependencies
npm install

# Step 2: Build web app
npm run build

# Step 3: Sync to Android
npx cap sync android

# Step 4: Build APK
cd android
./gradlew assembleDebug    # On Linux/Mac
gradlew.bat assembleDebug  # On Windows
cd ..

# APK is at: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 Installing the APK

### Method 1: Install via USB (Recommended)

1. **Enable USB Debugging on your Android device:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect device to computer via USB**

3. **Install the APK:**
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Method 2: Install via File Transfer

1. **Copy APK to your phone:**
   - Email it to yourself
   - Upload to Google Drive/Dropbox
   - Transfer via USB cable (copy to Downloads folder)
   - Use a file sharing app

2. **On your phone:**
   - Open the APK file
   - Allow installation from unknown sources if prompted
   - Tap "Install"

### Method 3: Wireless Install

```bash
# Connect device and computer to same WiFi
# Get device IP address from device settings
adb connect <device-ip>:5555
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎯 Building for Different Environments

### Debug APK (for testing)
```bash
cd android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`
- Can be installed on any device
- Includes debugging tools
- Larger file size
- No signing required

### Release APK (for production)

**First, create a signing key:**
```bash
keytool -genkey -v -keystore infinite-care-carer.keystore \
  -alias infinite-care-carer \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Then configure signing in `android/app/build.gradle`:**
```gradle
android {
    signingConfigs {
        release {
            storeFile file("../../infinite-care-carer.keystore")
            storePassword "YOUR_PASSWORD"
            keyAlias "infinite-care-carer"
            keyPassword "YOUR_PASSWORD"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Build release APK:**
```bash
cd android
./gradlew assembleRelease
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔍 Verifying the Build

After building, verify the APK:

```bash
# Check if APK exists
ls -lh android/app/build/outputs/apk/debug/app-debug.apk

# View APK details
aapt dump badging android/app/build/outputs/apk/debug/app-debug.apk | grep package

# Expected output:
# package: name='app.lovable.bbc802f7ef784e8cb6d09b852b32ed2b' versionCode='1' versionName='1.0'
```

---

## 🐛 Troubleshooting

### Problem: "Gradle build failed"

**Solution:**
```bash
# Clean build
cd android
./gradlew clean
./gradlew assembleDebug
```

### Problem: "SDK not found"

**Solution:** Install Android SDK
```bash
# Install Android Studio, which includes the SDK
# Or set ANDROID_HOME environment variable:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Problem: "Build tools version X not found"

**Solution:**
```bash
# Open Android Studio → SDK Manager
# Install the required build tools version
# Or update android/build.gradle to use an installed version
```

### Problem: "Out of memory during build"

**Solution:** Increase Gradle memory in `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### Problem: "Cannot install APK on device"

**Solution:**
```bash
# Uninstall old version first
adb uninstall app.lovable.bbc802f7ef784e8cb6d09b852b32ed2b

# Then install new version
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📦 APK Variants

You can build different APK variants:

```bash
cd android

# Debug APK (includes debugging, larger size)
./gradlew assembleDebug

# Release APK (optimized, requires signing)
./gradlew assembleRelease

# Build all variants
./gradlew assemble

# View all available tasks
./gradlew tasks
```

---

## 🎨 Customizing the Build

### Change App Name
Edit `android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Infinite Care - Carer</string>
```

### Change App Icon
Replace files in `android/app/src/main/res/mipmap-*` directories with your icon in different sizes.

### Change Version
Edit `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 2        // Increment for each release
    versionName "1.1"    // Display version
}
```

### Change Package Name
Edit `android/app/build.gradle`:
```gradle
defaultConfig {
    applicationId "com.yourcompany.carerapp"
}
```
(Also update in `capacitor.config.ts`)

---

## 📊 Build Statistics

After a successful build, you'll see:

```
BUILD SUCCESSFUL in 2m 15s
45 actionable tasks: 45 executed
```

**APK Details:**
- **Size:** ~20-30 MB (debug), ~10-15 MB (release)
- **Min Android Version:** Android 5.1 (API 22)
- **Target Android Version:** Latest (API 34+)
- **Supported ABIs:** armeabi-v7a, arm64-v8a, x86, x86_64

---

## 🚀 Advanced: Building AAB for Play Store

For Google Play Store, you need an Android App Bundle (AAB):

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

This AAB can be uploaded directly to Google Play Console.

---

## 📚 Additional Resources

- [Android Gradle Plugin Reference](https://developer.android.com/studio/build)
- [Capacitor Android Docs](https://capacitorjs.com/docs/android)
- [APK Analyzer Tool](https://developer.android.com/studio/build/apk-analyzer)

---

## ✅ Success Checklist

After building, verify:

- [ ] APK file exists at the expected location
- [ ] APK installs successfully on a test device
- [ ] App launches without errors
- [ ] Login works with carer credentials
- [ ] Camera permission prompts correctly
- [ ] Location permission prompts correctly
- [ ] All main features are accessible

---

## 🎉 Next Steps

Once you have the APK:

1. **Test thoroughly** on multiple devices
2. **Share with beta testers** for feedback
3. **Fix any bugs** discovered during testing
4. **Build release version** when ready
5. **Submit to Google Play Store** for distribution

---

**Need Help?**
- Check the [full Android guide](ANDROID_APP_GUIDE.md)
- Review [troubleshooting section](ANDROID_APP_GUIDE.md#troubleshooting)
- Examine build logs in `android/app/build/` directory

Happy building! 🚀
