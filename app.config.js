module.exports = ({ config }) => {
  // EAS automatically injects secrets as process.env variables during build
  const isEASBuild = process.env.EAS_BUILD === 'true';
  
  console.log('app.config.js - EAS_BUILD:', process.env.EAS_BUILD);
  console.log('app.config.js - API_KEY available:', !!process.env.API_KEY);
  
  // Get the base config from app.json
  const expoConfig = config.expo || {};
  
  // Read projectId from app.json directly since config parameter doesn't include it
  const fs = require('fs');
  const path = require('path');
  const appJsonPath = path.join(__dirname, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const projectId = appJson.expo?.extra?.eas?.projectId;
  
  return {
    ...config,
    expo: {
      ...expoConfig,
      extra: {
        // Preserve eas object with projectId from app.json
        eas: projectId ? { projectId } : {},
        // In EAS builds, inject process.env secrets. Otherwise undefined (falls back to @env)
        API_KEY: isEASBuild ? process.env.API_KEY : undefined,
        AUTH_DOMAIN: isEASBuild ? process.env.AUTH_DOMAIN : undefined,
        PROJECT_ID: isEASBuild ? process.env.PROJECT_ID : undefined,
        STORAGE_BUCKET: isEASBuild ? process.env.STORAGE_BUCKET : undefined,
        MESSAGING_SENDER_ID: isEASBuild ? process.env.MESSAGING_SENDER_ID : undefined,
        APP_ID: isEASBuild ? process.env.APP_ID : undefined,
        MEASUREMENT_ID: isEASBuild ? process.env.MEASUREMENT_ID : undefined,
        GOOGLE_WEB_CLIENT_ID: isEASBuild ? process.env.GOOGLE_WEB_CLIENT_ID : undefined,
        EXPO_CLIENT_ID: isEASBuild ? process.env.EXPO_CLIENT_ID : undefined,
        IOS_CLIENT_ID: isEASBuild ? process.env.IOS_CLIENT_ID : undefined,
        ANDROID_CLIENT_ID: isEASBuild ? process.env.ANDROID_CLIENT_ID : undefined,
        WORD_LADDER_BACKEND: isEASBuild ? process.env.WORD_LADDER_BACKEND : undefined,
      }
    }
  };
};
