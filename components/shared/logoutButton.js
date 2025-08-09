import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

export default function LogoutButton({auth, onClickLogout}) {
    const [disabled, setDisabled] = useState(false);
    const handleLogout = () => {
        setDisabled(true)
        onClickLogout()
    }

    return (
        <TouchableOpacity style={{ width: `95%`, margin: 5 }} disabled={disabled} onPress={() => handleLogout()}>
            <View style={[styles.button, { opacity: disabled ? 0.3 : 1 }]}>
                <Text style={styles.buttonText}> {disabled ? `Logging Out` : `Log Out`} </Text>
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 10,
        paddingVertical: 14,
        marginVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: 'gray',
        width: '100%',
        shadowColor: 'rgba(0,0,0, .4)', // IOS
        shadowOffset: { height: 1, width: 1 }, // IOS
        shadowOpacity: 1, // IOS
        shadowRadius: 1, //IOS
        elevation: 2, // Android
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: 16,
        textAlign: 'center',
    }
})