import React from 'react'
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Profile( {navigation} ) {
  return (
    <View> 
      <Ionicons
        name="person-circle"
        size={26}
        style={{ paddingRight: 10 }}
        color="gray"
        onPress={() =>  navigation.navigate('ProfilePage')}
      />
    </View>
  )
}
