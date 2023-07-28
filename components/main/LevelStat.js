import React, { useState } from 'react'
import { View, StyleSheet, Text, ScrollView } from 'react-native'
import FlatButton from '../shared/button';
import { levelColorScheme } from '../../redux/constants/colorScheme';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../redux/actions';

export default function LevelStat({ navigation, level }) {
    return(
        <View style={[styles.container, {backgroundColor: levelColorScheme[level]}]}>
            {level}
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