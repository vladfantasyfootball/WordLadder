import React from 'react'
import { View } from 'react-native'
import LogoutButton from '../shared/logoutButton'
import { getAuth } from 'firebase/auth';

export default function ProfilePage({ navigation, level }) {
    const auth = getAuth()
    const logoutFunction = async () => {
        await auth.signOut().catch((e) => {
            console.log(e)
        })
    }
    return (
        <View >
            <LogoutButton auth={auth} onClickLogout={() => {logoutFunction()}}/>
        </View>
    )
}