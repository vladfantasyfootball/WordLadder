export default {
  expo: {
    name: "WordLadder",
    slug: "WordLadder",
    version: "2",
    orientation: "portrait",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    extra: {
      API_KEY: process.env.API_KEY,
      AUTH_DOMAIN: process.env.AUTH_DOMAIN,
      PROJECT_ID: process.env.PROJECT_ID,
      STORAGE_BUCKET: process.env.STORAGE_BUCKET,
      MESSAGING_SENDER_ID: process.env.MESSAGING_SENDER_ID,
      APP_ID: process.env.APP_ID,
      MEASUREMENT_ID: process.env.MEASUREMENT_ID,
      GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
      EXPO_CLIENT_ID: process.env.EXPO_CLIENT_ID,
      IOS_CLIENT_ID: process.env.IOS_CLIENT_ID,
      ANDROID_CLIENT_ID: process.env.ANDROID_CLIENT_ID,
      WORD_LADDER_BACKEND: process.env.WORD_LADDER_BACKEND
    },
    ios: {
      googleServicesFile: "./GoogleService-Info.plist",
      bundleIdentifier: "com.vlad.wordLadder",
      buildNumber: "3",
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    plugins: [
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            deploymentTarget: "15.1"
          }
        }
      ]
    ],
    android: {
      googleServicesFile: "./google-services.json",
      package: "com.vlad.wordLadderAndroid",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    scheme: "wordladder",
    owner: "vladfantasyfootball",
    extra: {
      eas: {
        projectId: "15906805-b6d8-483b-8ff2-0d92876281fa"
      },
      API_KEY: process.env.API_KEY,
      AUTH_DOMAIN: process.env.AUTH_DOMAIN,
      PROJECT_ID: process.env.PROJECT_ID,
      STORAGE_BUCKET: process.env.STORAGE_BUCKET,
      MESSAGING_SENDER_ID: process.env.MESSAGING_SENDER_ID,
      APP_ID: process.env.APP_ID,
      MEASUREMENT_ID: process.env.MEASUREMENT_ID,
      GOOGLE_WEB_CLIENT_ID: process.env.GOOGLE_WEB_CLIENT_ID,
      EXPO_CLIENT_ID: process.env.EXPO_CLIENT_ID,
      IOS_CLIENT_ID: process.env.IOS_CLIENT_ID,
      ANDROID_CLIENT_ID: process.env.ANDROID_CLIENT_ID,
      WORD_LADDER_BACKEND: process.env.WORD_LADDER_BACKEND
    }
  },
  "react-native-google-mobile-ads": {
    "android_app_id": "ca-app-pub-5826991812725211~3233115456",
    "ios_app_id": "ca-app-pub-5826991812725211~5820606577"
  }
};
