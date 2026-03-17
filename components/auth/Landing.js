import React, { useEffect } from 'react'
import { Text, View, Button, Platform, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
import { getAuth, signInWithCredential, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import config from '../../config';

// Platform-specific imports
const GoogleSignin = Platform.OS === 'android' ? require('@react-native-google-signin/google-signin').GoogleSignin : null;

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
      Alert.alert('Sign In Failed', 'Could not sign in with Google. Please try again.');
    }
  }

  async function onAppleButtonPress() {
    try {
      // Start the sign-in request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
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
      Alert.alert('Sign In Failed', 'Could not sign in with Apple. Please try again.');
    }
  }
  
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#90EE90'}}>
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
        onPress={() => onAppleButtonPress()}
      />}
      {Platform.OS === 'android' &&
      <Button
        title="Sign in with Google"
        onPress={() => onGoogleButtonPress()}
      />}
    </View>
  )
}
