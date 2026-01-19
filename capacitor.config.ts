import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bbc802f7ef784e8cb6d09b852b32ed2b',
  appName: 'Infinite Care - Carer',
  webDir: 'dist',
  server: {
    url: 'https://bbc802f7-ef78-4e8c-b6d0-9b852b32ed2b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#E6F7F5',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#E6F7F5'
    }
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Infinite Care Carer'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#E6F7F5'
  }
};

export default config;
