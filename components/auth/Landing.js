import React from 'react'
import { Text, View, Button, Platform } from 'react-native'
import { AppleButton, appleAuth } from '@invertase/react-native-apple-authentication';
import { getAuth } from "firebase/auth";

export default function LandingScreen({ navigation }) {

  async function onAppleButtonPress() {
    console.log('here')
    const auth = getAuth();
    // Start the sign-in request
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      // As per the FAQ of react-native-apple-authentication, the name should come first in the following array.
      // See: https://github.com/invertase/react-native-apple-authentication#faqs
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });

    console.log(appleAuthRequestResponse)

    // Ensure Apple returned a user identityToken
    if (!appleAuthRequestResponse.identityToken) {
      throw new Error('Apple Sign-In failed - no identify token returned');
    }

    // Create a Firebase credential from the response
    const { identityToken, nonce } = appleAuthRequestResponse;
    const appleCredential = auth.AppleAuthProvider.credential(identityToken, nonce);

    // Sign the user in with the credential
    return auth().signInWithCredential(appleCredential);
  }
  
  
  return (
    <View style={{flex: 1, justifyContent: 'center', margin: '10px'}}>
      <Button 
        title="Register"
        onPress={() => {navigation.navigate("Register")}}/>
      <Button 
        title="Login"
        onPress={() => {navigation.navigate("Login")}}/>
        
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
    </View>
  )
}
