import React, { useEffect } from 'react'
import { Text, View, Button, Platform } from 'react-native'
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
import { getAuth, signInWithCredential, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
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
      const auth = getAuth();
      return signInWithCredential(auth, googleCredential);
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
      const provider = new OAuthProvider('apple.com');
      const appleCredential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      // Sign the user in with the credential
      const auth = getAuth();
      let user = await signInWithCredential(auth, appleCredential);
      return user
    } catch (error) {
      console.error('Apple sign-in error:', error);
    }
  }
  
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', margin: '10px', backgroundColor: '#90EE90'}}>
      <Text style={{fontSize: 48, fontWeight: 'bold', marginBottom: 8}}>Word Ladder</Text>
      <Text style={{fontSize: 16, color: '#666', marginBottom: 40}}>MuskratProductions</Text>
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
