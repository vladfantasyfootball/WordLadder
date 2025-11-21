import React, { useEffect } from 'react'
import { Text, View, Button, Platform } from 'react-native'
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
import { AppleAuthProvider, GoogleAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import config from '../../config';

export default function LandingScreen({ navigation }) {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Configure Google Sign-In. Ensure `GOOGLE_WEB_CLIENT_ID` is set in your env/config for Android.
      if (config.GOOGLE_WEB_CLIENT_ID) {
        GoogleSignin.configure({ webClientId: config.GOOGLE_WEB_CLIENT_ID });
      } else {
        console.warn('Google Sign-In web client ID not set in config.GOOGLE_WEB_CLIENT_ID');
      }
    }
  }, []);

  async function onGoogleButtonPress() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const { idToken, accessToken } = userInfo;
      const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
      const user = await signInWithCredential(getAuth(), googleCredential);
      return user;
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Google sign-in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Google sign-in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Google Play Services not available or outdated');
      } else {
        console.error('Google sign-in error:', error);
      }
    }
  }

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
      {Platform.OS === 'android' && (
        config.GOOGLE_WEB_CLIENT_ID ? (
          <GoogleSigninButton
            style={{ width: 192, height: 48 }}
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Light}
            onPress={() => onGoogleButtonPress().then(() => console.log('Google sign-in complete!'))}
          />
        ) : (
          <Text style={{textAlign: 'center'}}>Google Sign-In not configured. Set `GOOGLE_WEB_CLIENT_ID` in config.</Text>
        )
      )}
    </View>
  )
}
