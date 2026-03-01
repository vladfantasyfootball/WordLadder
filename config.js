import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get config from expo-constants (works with EAS builds)
const extra = Constants.expoConfig?.extra || {};

// In development, try to import from @env if available
let ENV_VARS = {};
if (__DEV__) {
	try {
		ENV_VARS = require('@env');
	} catch (e) {
		console.log('No .env file found, using Constants.expoConfig.extra');
	}
}

// Use localhost in development, Railway in production
const getBackendUrl = () => {
	if (__DEV__) {
		// Development builds use localhost
		return Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';
	}
	// Production builds use Railway from EAS secrets
	return extra.WORD_LADDER_BACKEND || ENV_VARS.WORD_LADDER_BACKEND;
};

export default {
	API_KEY: extra.API_KEY || ENV_VARS.API_KEY,
	AUTH_DOMAIN: extra.AUTH_DOMAIN || ENV_VARS.AUTH_DOMAIN,
	PROJECT_ID: extra.PROJECT_ID || ENV_VARS.PROJECT_ID,
	STORAGE_BUCKET: extra.STORAGE_BUCKET || ENV_VARS.STORAGE_BUCKET,
	MESSAGING_SENDER_ID: extra.MESSAGING_SENDER_ID || ENV_VARS.MESSAGING_SENDER_ID,
	APP_ID: extra.APP_ID || ENV_VARS.APP_ID,
	MEASUREMENT_ID: extra.MEASUREMENT_ID || ENV_VARS.MEASUREMENT_ID,
	GOOGLE_WEB_CLIENT_ID: extra.GOOGLE_WEB_CLIENT_ID || ENV_VARS.GOOGLE_WEB_CLIENT_ID,
	EXPO_CLIENT_ID: extra.EXPO_CLIENT_ID || ENV_VARS.EXPO_CLIENT_ID,
	IOS_CLIENT_ID: extra.IOS_CLIENT_ID || ENV_VARS.IOS_CLIENT_ID,
	ANDROID_CLIENT_ID: extra.ANDROID_CLIENT_ID || ENV_VARS.ANDROID_CLIENT_ID,
	WORD_LADDER_BACKEND: getBackendUrl()
};