import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useSelector } from 'react-redux';
import { levelColorScheme } from '../../redux/constants/colorScheme';
import LadderStepWord from './LadderStepWord';
import * as Animatable from 'react-native-animatable';

export const completionBonusMap = {
    one: 50,
    two: 100,
    three: 150,
}

export default function LevelCompleteScreen({ completeLadder, level, shortestSolution }) {
    const currentUser = useSelector((state) => {return state.userState.currentUser});
    const [showShortest, setShowShortest] = useState(false);
    
    let timeTaken = Math.round((currentUser.wordLadder[level.toLowerCase()].timeFinished - currentUser.wordLadder[level.toLowerCase()].timeStarted) / 1000);
    let timeFormattedTimeTaken = null;
    if(timeTaken <= 3600){
        timeFormattedTimeTaken = new Date(timeTaken * 1000).toISOString().substr(14, 5);
    } else {
        timeFormattedTimeTaken =  new Date(timeTaken * 1000).toISOString().substr(11, 8);
    }
    const timeBonus = 180 - timeTaken > 0 ? 180 - timeTaken : 0;
    const completionBonus = completionBonusMap[level.toLowerCase()];
    const shortestLength = shortestSolution.length;
    const userLength = completeLadder.length;
    const wordBonus = Math.max(0, 100 - (userLength - shortestLength) * 5);
    
    const displayLadder = showShortest ? shortestSolution : completeLadder;
    
    return (
        <View>
            <Animatable.View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} animation="bounceInLeft" duration={2000}>
                <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 20, fontSize: 24 }}>
                    {`Congratulations!`}
                </Text>
            </Animatable.View>
            <Animatable.View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} animation="bounceInRight" duration={2000} delay={1000}>
                <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingBottom: 10  }}>
                    {`Time Taken: ${timeFormattedTimeTaken}`}
                </Text>
            </Animatable.View>
            
            {/* Segmented Control for tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, !showShortest && styles.activeTab]}
                    onPress={() => setShowShortest(false)}
                >
                    <Text style={[styles.tabText, !showShortest && styles.activeTabText]}>Your Solution</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, showShortest && styles.activeTab]}
                    onPress={() => setShowShortest(true)}
                >
                    <Text style={[styles.tabText, showShortest && styles.activeTabText]}>Shortest Solution</Text>
                </TouchableOpacity>
            </View>
            
            <View
                style={{
                    borderTopColor: 'black',
                    borderTopWidth: 2,
                }}
            />
            <View style={{ height: 300 }}>
                <ScrollView
                    contentContainerStyle={{ alignItems: 'center', paddingTop: 10, marginTop: 5, paddingBottom: 5, backgroundColor: `${levelColorScheme[level]}` }}
                    persistentScrollbar={true}>
                    {displayLadder.map((ladderWord, index) => {
                        return (
                            <LadderStepWord
                                key={index}
                                word={ladderWord}
                                level={(index === 0 || index === displayLadder.length - 1) ? null : level}
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#E0E0E0',
        borderRadius: 8,
        padding: 4,
        marginHorizontal: 20,
        marginVertical: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: 'white',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#000',
    },
})