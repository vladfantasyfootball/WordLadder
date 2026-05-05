import React, { useEffect } from 'react'
import { View, Text, Platform, TouchableOpacity, StyleSheet, Alert, ImageBackground } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
import { getAuth, signInWithCredential, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import config from '../../config';

// Platform-specific imports
const { GoogleSignin, statusCodes } = Platform.OS === 'android' ? require('@react-native-google-signin/google-signin') : {};

export default function LandingScreen({ navigation }) {

  // Configure Google Sign-In for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      GoogleSignin.configure({
        webClientId: config.GOOGLE_WEB_CLIENT_ID,
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
      const isCancel = statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED;
      const isInProgress = statusCodes && error.code === statusCodes.IN_PROGRESS;
      const isPlayServicesError = statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE;

      if (!isCancel && !isInProgress) {
        Alert.alert('Sign In Failed', isPlayServicesError
          ? 'Google Play Services not available'
          : 'Could not sign in with Google. Please try again.'
        );
      }
    }
  }

  async function onAppleButtonPress() {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identify token returned');
      }

      const { identityToken, nonce } = appleAuthRequestResponse;
      const provider = new OAuthProvider('apple.com');
      const appleCredential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      const auth = getAuth();
      return await signInWithCredential(auth, appleCredential);
    } catch (error) {
      console.error('Apple sign-in error:', error);
      Alert.alert('Sign In Failed', 'Could not sign in with Apple. Please try again.');
    }
  }

  return (
    <ImageBackground
      source={require('../../assets/login-screen.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.buttonArea}>
        {Platform.OS === 'ios' &&
          <AppleButton
            buttonStyle={AppleButton.Style.WHITE}
            buttonType={AppleButton.Type.SIGN_IN}
            style={styles.appleButton}
            onPress={() => onAppleButtonPress()}
          />
        }
        {Platform.OS === 'android' &&
          <TouchableOpacity style={styles.googleButton} onPress={() => onGoogleButtonPress()}>
            <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>
        }
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonArea: {
    position: 'absolute',
    bottom: 250,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  appleButton: {
    width: 240,
    height: 50,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3c4043',
  },
});
