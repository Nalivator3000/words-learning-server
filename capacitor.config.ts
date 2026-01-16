import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lexybooster.app',
  appName: 'LexyBooster',
  webDir: 'public',

  // Server configuration - loads from production URL
  server: {
    url: 'https://lexybooster.com',
    cleartext: false,
    // For local development, uncomment below and comment out url above:
    // androidScheme: 'https',
    // iosScheme: 'https'
  },

  // iOS specific configuration
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a1a2e',
    preferredContentMode: 'mobile',
    scheme: 'LexyBooster',
    // Allows web content to be loaded
    limitsNavigationsToAppBoundDomains: false
  },

  // Android specific configuration (for future use)
  android: {
    backgroundColor: '#1a1a2e',
    allowMixedContent: false
  },

  // Plugin configurations
  plugins: {
    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#1a1a2e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },

    // Status Bar
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a2e'
    },

    // Keyboard
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },

    // Push Notifications (optional - configure later)
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },

  // Logging (disable in production)
  loggingBehavior: 'none'
};

export default config;
