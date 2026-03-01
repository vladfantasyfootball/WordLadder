const fs = require('fs');
const path = require('path');

// Read app.json
const appJsonPath = path.join(__dirname, 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

module.exports = ({ config }) => {
  const isEASBuild = process.env.EAS_BUILD === 'true';
  
  console.log('app.config.js - EAS_BUILD:', process.env.EAS_BUILD);
  console.log('app.config.js - API_KEY available:', !!process.env.API_KEY);
  
  // Start with app.json config
  const baseConfig = appJson.expo;
  
  // Add environment variables to extra if in EAS build
  const extra = {
    ...(baseConfig.extra || {}),
  };
  
  if (isEASBuild) {
    // In EAS builds, inject all secrets from process.env
    extra.API_KEY = process.env.API_KEY;
    extra.AUTH_DOMAIN = process.env.AUTH_DOMAIN;
    extra.PROJECT_ID = process.env.PROJECT_ID;
    extra.STORAGE_BUCKET = process.env.STORAGE_BUCKET;
    extra.MESSAGING_SENDER_ID = process.env.MESSAGING_SENDER_ID;
    extra.APP_ID = process.env.APP_ID;
    extra.MEASUREMENT_ID = process.env.MEASUREMENT_ID;
    extra.GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
    extra.EXPO_CLIENT_ID = process.env.EXPO_CLIENT_ID;
    extra.IOS_CLIENT_ID = process.env.IOS_CLIENT_ID;
    extra.ANDROID_CLIENT_ID = process.env.ANDROID_CLIENT_ID;
    extra.WORD_LADDER_BACKEND = process.env.WORD_LADDER_BACKEND;
  }
  
  return {
    ...appJson,
    expo: {
      ...baseConfig,
      extra,
    },
  };
};
