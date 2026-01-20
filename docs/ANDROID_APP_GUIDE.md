# Android Carer App - Complete Setup Guide

## 📱 Overview

The **Infinite Care - Carer** Android app is a Capacitor-based mobile application specifically designed for care workers. This guide covers everything from local development to Google Play Store deployment.

## ✅ What's Already Configured

- ✅ **Capacitor Configuration**: App ID, name, and web directory set
- ✅ **Android Platform**: Native Android project added and synced
- ✅ **Native Plugins**: Camera, Geolocation, Haptics, Push Notifications
- ✅ **App Assets**: Icons and splash screens configured
- ✅ **Permissions**: All required Android permissions added to manifest
- ✅ **Production Build**: Configured to bundle web app locally

### App Details
- **App ID**: `app.lovable.bbc802f7ef784e8cb6d09b852b32ed2b`
- **App Name**: Infinite Care - Carer
- **Version**: 1.0 (versionCode: 1)
- **Min SDK**: API 22 (Android 5.1)
- **Target SDK**: Latest (configured in root build.gradle)

---

## 🛠️ Prerequisites for Local Development

### Required Software

1. **Android Studio** (Arctic Fox or newer)
   - Download: https://developer.android.com/studio
   - Includes Android SDK, Build Tools, and Emulator

2. **Java Development Kit (JDK) 17+**
   - Already installed: OpenJDK 21.0.9

3. **Node.js 18+**
   - Already installed: v22.21.1

### Android SDK Setup

After installing Android Studio:

1. Open Android Studio → Tools → SDK Manager
2. Install the following:
   - ✅ Android SDK Platform 34 (or latest)
   - ✅ Android SDK Build-Tools 34.0.0 (or latest)
   - ✅ Android SDK Command-line Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools

3. Set environment variables (add to `~/.bashrc` or `~/.zshrc`):
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   ```

4. Verify setup:
   ```bash
   source ~/.bashrc  # or source ~/.zshrc
   echo $ANDROID_HOME
   adb --version
   ```

---

## 🚀 Building the Android App

### Option 1: Using Android Studio (Recommended)

This is the easiest way to build, test, and debug your app.

#### Step 1: Open Project in Android Studio

```bash
# From project root
npx cap open android
```

Or manually: **File → Open** → Select `/path/to/infinite-care-vue/android`

#### Step 2: Sync Project with Gradle Files

Android Studio should automatically prompt you to sync. If not:
- Click **File → Sync Project with Gradle Files**

#### Step 3: Run on Emulator or Device

**To run on an emulator:**
1. Tools → Device Manager → Create Device
2. Choose a device definition (e.g., Pixel 5)
3. Download and select a system image (API 34 recommended)
4. Click the green **Run** button in toolbar

**To run on a physical device:**
1. Enable Developer Options on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging in Developer Options
3. Connect device via USB
4. Click the green **Run** button and select your device

#### Step 4: Build Debug APK

**Using Android Studio:**
- Build → Build Bundle(s) / APK(s) → Build APK(s)
- APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

**Using Terminal:**
```bash
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Option 2: Using Capacitor CLI + Gradle (Terminal Only)

#### Build and Run in One Command

```bash
# Run on connected device/emulator
npx cap run android

# Run on specific device
npx cap run android --target=<device-id>

# List available devices
adb devices
```

#### Manual Gradle Build

```bash
# Build debug APK
cd android
./gradlew assembleDebug

# Build release APK (unsigned)
./gradlew assembleRelease

# Install debug APK on connected device
./gradlew installDebug
```

---

## 📦 Building for Production (Google Play Store)

### Step 1: Generate Signing Key

Android apps must be signed before uploading to the Play Store. Create a keystore:

```bash
keytool -genkey -v -keystore infinite-care-carer.keystore \
  -alias infinite-care-carer \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Important:** Save this file securely! You'll need it for all future app updates.

You'll be prompted to enter:
- Password for keystore
- Your name, organization, city, state, country
- Password for alias (can be same as keystore password)

### Step 2: Configure Signing in build.gradle

Edit `android/app/build.gradle`:

```gradle
android {
    ...

    signingConfigs {
        release {
            storeFile file("../../infinite-care-carer.keystore")
            storePassword "YOUR_KEYSTORE_PASSWORD"
            keyAlias "infinite-care-carer"
            keyPassword "YOUR_KEY_PASSWORD"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true  // Enable code shrinking
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Security Best Practice:** Don't commit passwords to Git. Use environment variables or a separate keystore.properties file:

Create `android/keystore.properties`:
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
storeFile=../../infinite-care-carer.keystore
keyAlias=infinite-care-carer
```

Then in `android/app/build.gradle`:
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}
```

Add to `.gitignore`:
```
keystore.properties
*.keystore
```

### Step 3: Build Release AAB (Android App Bundle)

Google Play requires AAB format:

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

**Why AAB instead of APK?**
- Smaller download sizes for users
- Automatic split APKs for different device configurations
- Required by Google Play Store

### Step 4: Test Release Build Locally

You can't directly install an AAB. Generate universal APK for testing:

```bash
bundletool build-apks --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=app-release.apks \
  --mode=universal \
  --ks=infinite-care-carer.keystore \
  --ks-key-alias=infinite-care-carer

# Install on connected device
bundletool install-apks --apks=app-release.apks
```

---

## 📤 Publishing to Google Play Store

### Step 1: Create Google Play Console Account

1. Go to https://play.google.com/console
2. Sign up with a Google account
3. Pay one-time registration fee ($25 USD)
4. Verify your email

### Step 2: Create New App in Play Console

1. Click **Create App**
2. Fill in app details:
   - **App name**: Infinite Care - Carer
   - **Default language**: English (UK or US)
   - **App or game**: App
   - **Free or paid**: Free (or paid if monetizing)

3. Complete declarations:
   - Privacy policy URL (required)
   - App category: Medical or Productivity
   - Target audience and content ratings

### Step 3: Set Up App Content

Complete all required sections in the Play Console:

**1. Store Listing:**
- App name: Infinite Care - Carer
- Short description (80 chars max): Care management app for professional carers
- Full description (4000 chars max): Describe features, benefits, how it works
- App icon: 512x512 PNG (use `src/assets/capacitor/icon.png`)
- Feature graphic: 1024x500 JPG/PNG
- Screenshots: At least 2 phone screenshots (1080x1920 or similar)
- App category: Medical or Productivity
- Contact details: Email, phone, website

**2. Content Rating:**
- Complete the questionnaire about app content
- Submit for rating (PEGI, ESRB, etc.)

**3. Target Audience:**
- Select age groups (likely 18+)
- Specify if app is designed for children (probably no)

**4. Privacy Policy:**
- Provide URL to your privacy policy
- Required for apps accessing personal data

**5. App Access:**
- Specify if app requires login (yes)
- Provide test account credentials for reviewers

**6. Data Safety:**
- Declare what user data is collected:
  - Location data (for check-in verification)
  - Photos (visit documentation)
  - Personal info (staff profiles)
- Explain security practices

### Step 4: Create Release

1. Go to **Production → Create new release**
2. Upload your AAB: `android/app/build/outputs/bundle/release/app-release.aab`
3. Enter release name: "1.0" or descriptive name
4. Write release notes (what's new in this version)
5. Save and review

### Step 5: Submit for Review

1. Review all sections for completeness
2. Click **Review Release**
3. If all green, click **Start rollout to Production**
4. Google will review your app (typically 1-3 days)

### Step 6: Monitor and Update

- Track installs, ratings, reviews in Play Console
- Respond to user reviews
- Monitor crash reports in **Quality → Android vitals**

---

## 🔄 Updating the App

When you make changes to your web app or native code:

### Step 1: Rebuild Web App
```bash
npm run build
```

### Step 2: Sync to Android
```bash
npx cap sync android
```

### Step 3: Increment Version

Edit `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 2       // Increment by 1 for each release
    versionName "1.1"   // Visible to users (can be any format)
}
```

**Important:** `versionCode` must always increase with each release.

### Step 4: Build and Upload New AAB
```bash
cd android
./gradlew bundleRelease
```

Upload new AAB to Play Console as a new release.

---

## 🔧 Development Workflow

### Hot Reload During Development

For faster development, you can run the app against your local dev server:

1. **Start local dev server:**
   ```bash
   npm run dev
   ```
   Note the local IP (e.g., `http://192.168.1.100:5173`)

2. **Update capacitor.config.ts:**
   ```typescript
   server: {
     url: 'http://192.168.1.100:5173',
     cleartext: true
   }
   ```

3. **Sync and run:**
   ```bash
   npx cap sync android
   npx cap run android
   ```

4. **Make changes** in your code - they'll hot reload in the app!

**Remember:** Remove `server.url` for production builds.

### Debugging with Chrome DevTools

1. Run app on device/emulator
2. Open Chrome and go to: `chrome://inspect`
3. Find your app under "Remote Target"
4. Click **Inspect** to open DevTools
5. Debug JavaScript, view console logs, inspect network requests

---

## 🧪 Testing Native Features

### Camera

Test photo capture during visits:
```typescript
// In your app: CarerVisitWorkflow.tsx
const { takePhoto } = useCamera();
const photo = await takePhoto();
```

**Testing checklist:**
- ✅ Camera permission prompt shows on first use
- ✅ Camera opens and captures photo
- ✅ Photo uploads to Supabase storage
- ✅ Photo displays in visit record

### Location/GPS

Test location check-in:
```typescript
// In your app: LocationVerification.tsx
const { getCurrentLocation } = useGeolocation();
const location = await getCurrentLocation(true);
```

**Testing checklist:**
- ✅ Location permission prompt shows
- ✅ GPS acquires location within 5 seconds
- ✅ Accuracy is shown (< 20m is good)
- ✅ Distance to client location calculated correctly
- ✅ Check-in validates within 200m radius

### Push Notifications

Test real-time notifications:

**Setup Firebase Cloud Messaging (FCM):**

1. Go to https://console.firebase.google.com/
2. Create a new project or use existing
3. Add Android app with package name: `app.lovable.bbc802f7ef784e8cb6d09b852b32ed2b`
4. Download `google-services.json`
5. Place in `android/app/google-services.json`
6. Sync Capacitor: `npx cap sync android`

**Testing checklist:**
- ✅ Permission prompt shows for notifications
- ✅ FCM token is generated and saved to user profile
- ✅ Test notification from Firebase Console appears
- ✅ Tapping notification opens app

### Haptics

Test tactile feedback:
```typescript
const { notification } = useHaptics();
await notification(NotificationType.Success);
```

**Testing checklist:**
- ✅ Vibration works on button press
- ✅ Different haptic styles feel different
- ✅ Doesn't crash on devices without haptic support

---

## 🐛 Troubleshooting

### Issue: White screen on app launch

**Cause:** Web assets not copied or built incorrectly

**Solution:**
```bash
npm run build
npx cap sync android
```

### Issue: Plugins not working (camera, location, etc.)

**Cause:** Permissions not granted or plugin not synced

**Solution:**
1. Check AndroidManifest.xml has required permissions (already added)
2. Uninstall app from device
3. Rebuild and reinstall:
   ```bash
   npx cap sync android
   npx cap run android
   ```
4. Grant permissions when prompted

### Issue: App crashes on startup

**Cause:** JavaScript error or missing native dependency

**Solution:**
1. Check logs: `adb logcat | grep -i Capacitor`
2. Open Chrome DevTools: `chrome://inspect`
3. Check for JavaScript errors in console

### Issue: Can't install APK on device

**Cause:** APK not signed or wrong architecture

**Solution:**
```bash
# For debug builds, use universal APK:
./gradlew assembleDebug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Issue: Gradle build fails with "SDK not found"

**Cause:** Android SDK not installed or ANDROID_HOME not set

**Solution:**
```bash
# Set environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Verify
echo $ANDROID_HOME
```

### Issue: Build fails with "Failed to find Build Tools"

**Cause:** Missing Android SDK Build Tools

**Solution:**
1. Open Android Studio → SDK Manager
2. Install latest Build Tools
3. Or via command line:
   ```bash
   sdkmanager "build-tools;34.0.0"
   ```

---

## 📱 App Features Reference

Your Android app includes these carer-specific features:

### Core Features
- ✅ **Dashboard**: Today's schedule, upcoming visits, tasks
- ✅ **Schedule**: Calendar view of appointments
- ✅ **Visit Management**: Check-in/out with GPS verification
- ✅ **Photo Documentation**: Capture visit photos with camera
- ✅ **Care Plans**: View assigned client care plans
- ✅ **Service Reports**: Document visit outcomes
- ✅ **Forms**: Fill dynamic forms during visits
- ✅ **Time Tracking**: Attendance and working hours
- ✅ **Payments**: View salary, expenses, invoices
- ✅ **Messages**: In-app communication with admins
- ✅ **Documents**: Access policies and procedures
- ✅ **Training**: Complete required courses
- ✅ **Notifications**: Real-time alerts via push

### Native Features
- ✅ **GPS Location**: Verify check-in at client location
- ✅ **Camera**: Document visits with photos
- ✅ **Push Notifications**: Real-time schedule updates
- ✅ **Haptic Feedback**: Tactile confirmation of actions
- ✅ **Offline Support**: PWA caching for basic functionality

---

## 🔐 Security Considerations

### Data Security
- All communication over HTTPS
- Supabase Row Level Security (RLS) enforced
- JWT token-based authentication
- No sensitive data stored locally (uses secure Supabase storage)

### Permissions
- Camera: Only for visit documentation
- Location: Only during check-in/out (not tracked continuously)
- Notifications: For work-related alerts only
- All permissions requested at runtime with clear explanations

### Compliance
- GDPR compliant (user data encrypted, right to deletion)
- HIPAA considerations (no PHI stored on device)
- Data retention policies managed by backend

---

## 📚 Additional Resources

### Official Documentation
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

### Native Plugin Docs
- [Camera Plugin](https://capacitorjs.com/docs/apis/camera)
- [Geolocation Plugin](https://capacitorjs.com/docs/apis/geolocation)
- [Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Haptics Plugin](https://capacitorjs.com/docs/apis/haptics)

### Project-Specific Docs
- [Capacitor Setup](./CAPACITOR_SETUP.md) - Plugin usage examples
- [Main README](../README.md) - Project overview

---

## 🎯 Next Steps

Now that your Android app is set up:

1. ✅ **Test locally** on emulator or device
2. ✅ **Set up Firebase** for push notifications
3. ✅ **Generate signing key** for production builds
4. ✅ **Create Google Play Console account**
5. ✅ **Prepare store listing** (screenshots, descriptions)
6. ✅ **Build release AAB** and test thoroughly
7. ✅ **Submit to Google Play** for review
8. ✅ **Monitor reviews** and crashes after launch

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check [GitHub Issues](https://github.com/anthropics/claude-code/issues) for the project
2. Review Capacitor troubleshooting: https://capacitorjs.com/docs/troubleshooting
3. Consult Android Studio logs: `adb logcat`
4. Use Chrome DevTools for JavaScript debugging

---

**Last Updated**: January 2026
**App Version**: 1.0
**Capacitor Version**: 8.0.1
