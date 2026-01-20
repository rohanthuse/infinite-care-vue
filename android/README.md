# Infinite Care - Carer Android App

This directory contains the native Android project for the Infinite Care Carer mobile app.

## 🚀 Quick Build

### From Project Root:

**Linux/Mac:**
```bash
./build-apk.sh
```

**Windows:**
```cmd
build-apk.bat
```

**Manual:**
```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug    # Linux/Mac
gradlew.bat assembleDebug  # Windows
```

**APK Location:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📱 Installing APK

### Via USB:
```bash
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Via File Transfer:
Copy the APK to your phone and open it to install.

---

## 📚 Documentation

- **[BUILD_APK_GUIDE.md](../docs/BUILD_APK_GUIDE.md)** - Complete build instructions
- **[ANDROID_APP_GUIDE.md](../docs/ANDROID_APP_GUIDE.md)** - Full Android development guide
- **[ANDROID_QUICK_START.md](../docs/ANDROID_QUICK_START.md)** - 5-minute quick start

---

## 🔧 Development

### Open in Android Studio:
```bash
npx cap open android
```

### Sync after web changes:
```bash
npm run build
npx cap sync android
```

### Run on device:
```bash
npx cap run android
```

---

## 📦 App Details

- **Package:** app.lovable.bbc802f7ef784e8cb6d09b852b32ed2b
- **Min SDK:** 22 (Android 5.1)
- **Version:** 1.0

## 🔌 Native Plugins

- Camera (photo capture)
- Geolocation (GPS check-in)
- Haptics (vibration feedback)
- Push Notifications (FCM alerts)

---

For more details, see the [complete documentation](../docs/ANDROID_APP_GUIDE.md).
