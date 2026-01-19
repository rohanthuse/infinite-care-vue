# Capacitor Mobile App Setup - Infinite Care Carer

This guide explains how to set up the native mobile app for the Carer module.

## Generated Assets

The following branded assets have been created:

| Asset | Location | Size | Purpose |
|-------|----------|------|---------|
| App Icon | `src/assets/capacitor/icon.png` | 1024x1024 | Source icon for all platforms |
| Portrait Splash | `src/assets/capacitor/splash.png` | 1242x1920 | Phone splash screen |
| Landscape Splash | `src/assets/capacitor/splash-land.png` | 1920x1080 | Tablet splash screen |

Assets are also copied to `public/capacitor/` for easy access during native builds.

## Local Setup Instructions

### Prerequisites

- Node.js 18+
- **iOS**: Mac with Xcode 15+ installed
- **Android**: Android Studio with SDK installed

### Step 1: Export & Clone

1. Click **Settings** → **GitHub** → **Export to GitHub**
2. Clone your repository:
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Add Native Platforms

```bash
# Add iOS platform (requires Mac)
npx cap add ios

# Add Android platform
npx cap add android
```

### Step 4: Generate Platform-Specific Assets

#### iOS Icons (requires Xcode)

1. Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Replace icons with resized versions from `src/assets/capacitor/icon.png`
3. Required sizes: 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024 pixels

Or use a tool like [App Icon Generator](https://www.appicon.co/) to generate all sizes from the 1024x1024 source.

#### iOS Splash Screen

1. Open `ios/App/App/Assets.xcassets/Splash.imageset`
2. Add the splash images for different screen sizes

#### Android Icons

1. Copy icon to `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)
2. Create additional sizes:
   - `mipmap-hdpi`: 72x72
   - `mipmap-mdpi`: 48x48
   - `mipmap-xhdpi`: 96x96
   - `mipmap-xxhdpi`: 144x144
   - `mipmap-xxxhdpi`: 192x192

Or use Android Studio's Image Asset Studio (right-click `res` → New → Image Asset).

#### Android Splash Screen

1. Copy `splash.png` to `android/app/src/main/res/drawable/splash.png`
2. The splash screen is already configured in `capacitor.config.ts`

### Step 5: Build & Sync

```bash
# Build the web app
npm run build

# Sync to native platforms
npx cap sync
```

### Step 6: Run on Device/Emulator

```bash
# Run on iOS (requires Mac + Xcode)
npx cap run ios

# Run on Android
npx cap run android
```

To open in native IDEs for advanced configuration:

```bash
npx cap open ios     # Opens Xcode
npx cap open android # Opens Android Studio
```

## App Store Preparation

### iOS App Store

1. Configure signing in Xcode (Signing & Capabilities)
2. Set Bundle Identifier to `app.lovable.bbc802f7ef784e8cb6d09b852b32ed2b`
3. Archive and upload via App Store Connect

### Google Play Store

1. Generate signed APK/AAB in Android Studio
2. Configure signing in `android/app/build.gradle`
3. Upload to Google Play Console

## Hot Reload During Development

The app is configured to connect to the Lovable sandbox for hot-reload:

```
https://bbc802f7-ef78-4e8c-b6d0-9b852b32ed2b.lovableproject.com
```

For production builds, comment out the `server.url` in `capacitor.config.ts` to bundle the web app locally.

## Troubleshooting

### White screen on launch
- Ensure `npm run build` completed successfully
- Run `npx cap sync` after any web changes

### Splash screen not showing
- Verify splash images are in correct location
- Check `capacitor.config.ts` splash configuration

### Icons not updating
- Clean build in Xcode/Android Studio
- Delete app from device and reinstall
