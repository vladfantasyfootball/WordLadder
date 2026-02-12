import React, { useEffect } from 'react'
import { Text, View, Button, Platform } from 'react-native'
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
import { AppleAuthProvider, GoogleAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';
import config from '../../config';

// Only import GoogleSignin on Android to avoid iOS native module errors
const GoogleSignin = Platform.OS === 'android' ? require('@react-native-google-signin/google-signin').GoogleSignin : null;

console.log('CONFIG GOOGLE_WEB_CLIENT_ID (startup):', config.GOOGLE_WEB_CLIENT_ID);
console.log('CONFIG ANDROID_CLIENT_ID (startup):', config.ANDROID_CLIENT_ID);

export default function LandingScreen({ navigation }) {

  // Configure Google Sign-In for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      GoogleSignin.configure({
        webClientId: config.GOOGLE_WEB_CLIENT_ID, // Firebase Web Client ID
      });
    }
  }, []);

  // Google Sign-In handler for Android (uses Google Play Services)
  async function onGoogleButtonPress() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      const googleCredential = GoogleAuthProvider.credential(idToken);
      return signInWithCredential(getAuth(), googleCredential);
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  }

  // ...existing code...

  async function onAppleButtonPress() {
    try {
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        // As per the FAQ of react-native-apple-authentication, the name should come first in the following array.
        // See: https://github.com/invertase/react-native-apple-authentication#faqs
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      // Ensure Apple returned a user identityToken
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = AppleAuthProvider.credential(identityToken, nonce);

      // Sign the user in with the credential
      let user = await signInWithCredential(getAuth(), appleCredential);
      return user
    } catch (error) {
      console.error('Apple sign-in error:', error);
    }
  }
  
  return (
    <View style={{flex: 1, justifyContent: 'center', margin: '10px'}}>
      {Platform.OS === 'ios' && 
      <AppleButton
        buttonStyle={AppleButton.Style.WHITE}
        buttonType={AppleButton.Type.SIGN_IN}
        style={{
          width: 160,
          height: 45,
        }}
        onPress={() => onAppleButtonPress().then(() => console.log('Apple sign-in complete!'))}
      />}
      {Platform.OS === 'android' &&
      <Button
        title="Sign in with Google"
        onPress={() => onGoogleButtonPress().then(() => console.log('Google sign-in complete!'))}
      />}
    </View>
  )
}
