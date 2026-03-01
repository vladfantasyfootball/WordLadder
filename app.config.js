module.exports = ({ config }) => {
  // EAS automatically injects secrets as process.env variables during build
  const isEASBuild = process.env.EAS_BUILD === 'true';
  
  console.log('app.config.js - EAS_BUILD:', process.env.EAS_BUILD);
  console.log('app.config.js - API_KEY available:', !!process.env.API_KEY);
  
  // Get the base config from app.json
  const baseConfig = config || {};
  const expoConfig = baseConfig.expo || {};
  
  // Only inject extra fields during EAS builds
  if (isEASBuild) {
    return {
      ...baseConfig,
      expo: {
        ...expoConfig,
        extra: {
          ...(expoConfig.extra || {}),
          // In EAS builds, inject process.env secrets
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
          WORD_LADDER_BACKEND: process.env.WORD_LADDER_BACKEND,
        }
      }
    };
  }
  
  // In local dev, return config unchanged (preserves app.json extra.eas.projectId)
  return baseConfig;
};
