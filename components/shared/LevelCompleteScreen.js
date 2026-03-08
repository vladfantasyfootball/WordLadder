import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useSelector } from 'react-redux';
import { levelColorScheme } from '../../redux/constants/colorScheme';
import LadderStepWord from './LadderStepWord';
import * as Animatable from 'react-native-animatable';

export const completionBonusMap = {
    one: 50,
    two: 100,
    three: 150,
}

export default function LevelCompleteScreen({ completeLadder, level }) {
    const currentUser = useSelector((state) => {return state.userState.currentUser});
    let timeTaken = Math.round(Math.abs(((currentUser.wordLadder[level.toLowerCase()].timeFinished - currentUser.wordLadder[level.toLowerCase()].timeStarted)) / 1000));
    let timeFormattedTimeTaken = null;
    if(timeTaken <= 3600){
        timeFormattedTimeTaken = new Date(timeTaken * 1000).toISOString().substr(14, 5);
    } else {
        timeFormattedTimeTaken =  new Date(timeTaken * 1000).toISOString().substr(11, 8);
    }
    const timeBonus = 180 - timeTaken > 0 ? 180 - timeTaken : 0;
    const completionBonus = completionBonusMap[level.toLowerCase()];
    const wordBonus = Math.floor(180 - completeLadder.length * 10) > 0 ? Math.floor(180 - completeLadder.length * 10) : 0;
    return (
        <View>
            <Animatable.View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} animation="bounceInLeft" duration={2000}>
                <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 20, fontSize: 24 }}>
                    {`Congratulations!`}
                </Text>
            </Animatable.View>
            <Animatable.View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} animation="bounceInRight" duration={2000} delay={1000}>
                <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingBottom: 20  }}>
                    {`Time Taken: ${timeFormattedTimeTaken}`}
                </Text>
            </Animatable.View>
            <View
                style={{
                    borderTopColor: 'black',
                    borderTopWidth: 2,
                }}
            />
            <View style={{ height: '100%', maxHeight: 300 }}>
                <ScrollView
                    contentContainerStyle={{ alignItems: 'center', paddingTop: 10, marginTop: 5, paddingBottom: 5, backgroundColor: `${levelColorScheme[level]}` }}
                    persistentScrollbar={true}>
                    {completeLadder.map((ladderWord, index) => {
                        return (
                            <LadderStepWord
                                key={index}
                                word={ladderWord}
                                level={(index === 0 || index === completeLadder.length - 1) ? null : level}
                                size={50}
                                fontSize={32}
                            />
                        )
                    })}
                </ScrollView>
            </View>

            <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', borderColor: 'black', borderWidth: 2 }}>
                <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 10 }}>
                    {`Your Score:`}
                </Text>
                
                <View 
                    style={{
                        borderTopColor: 'black',
                        borderTopWidth: 2,
                        width: '50%',
                    }} 
                />
                <View style={{ display: 'flex', flexDirection: "row", justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 3 }}>
                        {`Completion Bonus: `}
                    </Text>
                    <Animatable.View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} animation="bounceInRight" duration={2000} delay={2000}>
                        <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 3 }}>
                            {`${completionBonus}`}
                        </Text>
                    </Animatable.View>
                </View>
                <View style={{ display: 'flex', flexDirection: "row", justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 3 }}>
                        {`Word Bonus: `}
                    </Text>
                    <Animatable.View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} animation="bounceInRight" duration={2000} delay={2500}>
                        <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 3 }}>
                            {`${wordBonus}`}
                        </Text>
                    </Animatable.View>
                </View>
                <View style={{ display: 'flex', flexDirection: "row", justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 3 }}>
                        {`Time Bonus: `}
                    </Text>
                    <Animatable.View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} animation="bounceInRight" duration={2000} delay={3000}>
                        <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 3 }}>
                            {`${timeBonus}`}
                        </Text>
                    </Animatable.View>
                </View>
                <View 
                    style={{
                        borderTopColor: 'black',
                        borderTopWidth: 2,
                        width: '50%',
                    }}
                />
                <View style={{ display: 'flex', flexDirection: "row", justifyContent: 'center', alignItems: 'center', fontSize: 18 }}>
                    <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 10, fontSize: 18 }}>
                        {`Total Score: `}
                    </Text>
                    <Animatable.View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} animation="bounceInRight" duration={2000} delay={3500}>
                        <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 10, fontSize: 18  }}>
                            {`${completionBonus + wordBonus + timeBonus}`}
                        </Text>
                    </Animatable.View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
})