import React from 'react'
import { Text, View, Button } from 'react-native'
import { AppleButton } from '@invertase/react-native-apple-authentication';


export default function LandingScreen({ navigation }) {
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
