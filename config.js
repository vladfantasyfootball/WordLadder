
import {
	API_KEY,
	AUTH_DOMAIN,
	PROJECT_ID,
	STORAGE_BUCKET,
	MESSAGING_SENDER_ID,
	APP_ID,
	MEASUREMENT_ID,
	GOOGLE_WEB_CLIENT_ID,
	EXPO_CLIENT_ID,
	IOS_CLIENT_ID,
	ANDROID_CLIENT_ID,
	WORD_LADDER_BACKEND
} from '@env';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Use localhost in development, Railway in production
const getBackendUrl = () => {
	if (__DEV__) {
		// Development builds use localhost
		return Platform.OS === 'ios' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';
	}
	// Production builds use Railway
	return WORD_LADDER_BACKEND;
};

export default {
	API_KEY,
	AUTH_DOMAIN,
	PROJECT_ID,
	STORAGE_BUCKET,
	MESSAGING_SENDER_ID,
	APP_ID,
	MEASUREMENT_ID,
	GOOGLE_WEB_CLIENT_ID,
	EXPO_CLIENT_ID,
	IOS_CLIENT_ID,
	ANDROID_CLIENT_ID,
	WORD_LADDER_BACKEND: getBackendUrl()
};