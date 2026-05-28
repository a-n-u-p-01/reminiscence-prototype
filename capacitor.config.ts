import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.anupam.reminiscence',
  appName: 'Reminiscence',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'anupam.com', 
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#09090b',
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#09090b',
      showSpinner: false,
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#09090b',
      overlaysWebView: true,
    },
  },
};

export default config;