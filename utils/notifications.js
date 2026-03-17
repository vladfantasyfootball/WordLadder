import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Registers the device for push notifications and returns the Expo push token
 * @returns {Promise<string|null>} The Expo push token or null if registration fails
 */
export async function registerForPushNotificationsAsync() {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return null;
    }
    
    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '785b674b-120a-4948-832d-898826a35fa1'
      });
      token = pushTokenData.data;
    } catch (error) {
      console.error('Error getting push token:', error);
    }
  }

  return token;
}

/**
 * Checks if the user has granted notification permissions
 * @returns {Promise<boolean>} True if permissions are granted
 */
export async function checkNotificationPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Requests notification permissions from the user
 * @returns {Promise<boolean>} True if permissions were granted
 */
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
