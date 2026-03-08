import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert } from 'react-native'
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
    const totalScore = completionBonus + wordBonus + timeBonus;
    
    const displayLadder = showShortest ? shortestSolution : completeLadder;

    const handleShare = async () => {
        try {
            const startWord = completeLadder[0];
            const endWord = completeLadder[completeLadder.length - 1];
            const message = `🎉 I just completed a Level ${level} Word Ladder puzzle!\n\n${startWord.toUpperCase()} → ${endWord.toUpperCase()}\n⏱️ Time: ${timeFormattedTimeTaken}\n📊 Score: ${totalScore}\n🪜 ${userLength} words\n\nCan you beat my score? Download Word Ladder now:\nhttps://testflight.apple.com/join/JxNSA5rZ`;
            
            const result = await Share.share({
                message: message,
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // shared with activity type of result.activityType
                } else {
                    // shared
                }
            } else if (result.action === Share.dismissedAction) {
                // dismissed
            }
        } catch (error) {
            Alert.alert('Error', 'Unable to share. Please try again.');
        }
    };
    
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
                            {`${totalScore}`}
                        </Text>
                    </Animatable.View>
                </View>
            </View>
            
            {/* Share Button */}
            <Animatable.View 
                animation="bounceIn" 
                duration={1500} 
                delay={4000}
                style={styles.shareButtonContainer}
            >
                <TouchableOpacity 
                    style={styles.shareButton}
                    onPress={handleShare}
                >
                    <Text style={styles.shareButtonText}>Share with Friends</Text>
                </TouchableOpacity>
            </Animatable.View>
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
    shareButtonContainer: {
        marginTop: 20,
        marginHorizontal: 20,
        marginBottom: 10,
    },
    shareButton: {
        backgroundColor: '#34C759',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    shareButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
})