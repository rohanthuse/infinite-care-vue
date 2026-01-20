# Android App - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This quick start guide will get your Android app running on a device or emulator.

### Prerequisites
- ✅ Android Studio installed
- ✅ Node.js 18+ installed
- ✅ Physical Android device OR Android Emulator set up

---

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Build Web App

```bash
npm run build
```

## Step 3: Open in Android Studio

```bash
npx cap open android
```

## Step 4: Run on Device/Emulator

In Android Studio:
1. Click the green **Run** button (or press Shift+F10)
2. Select your device or emulator
3. Wait for the app to build and install

That's it! 🎉

---

## 📱 Quick Commands

```bash
# Build and run in one command
npx cap run android

# Sync after making web changes
npm run build && npx cap sync android

# View logs
adb logcat | grep Capacitor
```

---

## 🔍 Testing Checklist

After launching the app, test these features:

- [ ] App launches without errors
- [ ] Login works (use your carer credentials)
- [ ] Dashboard shows today's appointments
- [ ] Navigate to different sections (Schedule, Clients, etc.)
- [ ] Take a test photo (camera permission)
- [ ] Enable location (for check-in feature)
- [ ] Receive a test notification

---

## 🐛 Common Issues

**White screen on launch?**
```bash
npm run build
npx cap sync android
```

**Permissions not working?**
- Uninstall app from device
- Reinstall: `npx cap run android`
- Grant permissions when prompted

**Build errors?**
- Make sure Android Studio is fully updated
- Tools → SDK Manager → Install latest SDK Platform and Build Tools

---

## 📚 Full Documentation

For detailed information on:
- Building for production
- Publishing to Google Play Store
- Configuring push notifications
- Advanced debugging

See: [ANDROID_APP_GUIDE.md](./ANDROID_APP_GUIDE.md)

---

## 🎯 Next Steps

1. Test all native features (camera, location, haptics)
2. Set up Firebase for push notifications
3. Build a release version for testing
4. Prepare for Google Play Store submission

Happy building! 🚀
