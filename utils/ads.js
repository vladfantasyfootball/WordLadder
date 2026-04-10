import MobileAds from 'react-native-google-mobile-ads';

// Initialize MobileAds SDK once at module level.
// Both App.js and Game.js import from here to avoid circular dependencies.
export const adsInitialized = MobileAds().initialize();
