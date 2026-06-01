import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anupam.reminiscence',
  appName: 'Reminiscence',
  webDir: 'dist',

  server: {
    androidScheme: 'https',
    hostname: 'reminiscence.com',
  },

  android: {
    allowMixedContent: true,
    backgroundColor: '#09090b',
    captureInput: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      launchFadeOutDuration: 200,
      backgroundColor: '#09090b',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    },

    StatusBar: {
      style: 'ANDROID_DARK',
      backgroundColor: '#09090b',
      overlaysWebView: true,
    },
  },
};

export default config;