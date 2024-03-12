import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { levelColorScheme } from '../../redux/constants/colorScheme';
import { useSelector } from 'react-redux';

export default function LevelStat({ navigation, level }) {
    const currentUser = useSelector((state) => {return state.userState.currentUser});

    return(
        <View style={[styles.container, {backgroundColor: levelColorScheme[level]}]}>
            <View>
                <Text style={{ fontWeight: 'bold', textAlign: 'center', alignItems: 'center', padding: 20, fontSize: 24, color: '#5B5A53' }}>
                    {`Current Streak: ${currentUser?.wordLadder[level.toLowerCase()].currentStreak}`}
                </Text>
                <Text style={{ fontWeight: 'bold', textAlign: 'center', alignItems: 'center', padding: 20, fontSize: 24, color: '#5B5A53' }}>
                    {`Longest Streak: ${currentUser?.wordLadder[level.toLowerCase()].longestStreak}`}
                </Text>
                <View
                    style={{
                        borderTopColor: '#5B5A53',
                        borderTopWidth: 2,
                    }}
                />  
                <Text style={{ fontWeight: 'bold', textAlign: 'center', alignItems: 'center', padding: 20, fontSize: 24, color: '#5B5A53' }}>
                    {`Total Score: ${currentUser?.wordLadder[level.toLowerCase()].totalScore}`}
                </Text>
                <Text style={{ fontWeight: 'bold', textAlign: 'center', alignItems: 'center', padding: 20, fontSize: 24, color: '#5B5A53' }}>
                    {`High Score: ${currentUser?.wordLadder[level.toLowerCase()].highScore}`}
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        alignContent: 'center',
    },
});