import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, Linking } from 'react-native'
import { useSelector, useDispatch } from 'react-redux';
import { levelColorScheme } from '../../redux/constants/colorScheme';
import LadderStepWord from './LadderStepWord';
import * as Animatable from 'react-native-animatable';
import { registerForPushNotificationsAsync, checkNotificationPermissions } from '../../utils/notifications';
import { updateUser } from '../../redux/actions';
import { getAuth } from 'firebase/auth';

export const completionBonusMap = {
    one: 50,
    two: 100,
    three: 150,
}

export default function LevelCompleteScreen({ completeLadder, level, shortestSolution, timeStarted, timeFinished, prevStats }) {
    const currentUser = useSelector((state) => {return state.userState.currentUser});
    const dispatch = useDispatch();
    const [showShortest, setShowShortest] = useState(false);
    
    // Use props if provided, otherwise fallback to Redux state
    const startTime = timeStarted || currentUser.wordLadder[level.toLowerCase()].timeStarted;
    const endTime = timeFinished || currentUser.wordLadder[level.toLowerCase()].timeFinished;
    
    // Calculate time taken with safety checks
    let timeTaken = 0;
    if (startTime && endTime && endTime > startTime) {
        timeTaken = Math.round((endTime - startTime) / 1000);
    }
    
    let timeFormattedTimeTaken = null;
    if(timeTaken <= 3600){
        timeFormattedTimeTaken = new Date(timeTaken * 1000).toISOString().substr(14, 5);
    } else {
        timeFormattedTimeTaken =  new Date(timeTaken * 1000).toISOString().substr(11, 8);
    }
    
    // Time bonus: Start at 100 points, lose 5 points for every 30 seconds after 1 minute
    let timeBonus = 100;
    if (timeTaken > 60) {
        const secondsOver = timeTaken - 60;
        const thirtySecondIntervals = Math.floor(secondsOver / 30);
        timeBonus = Math.max(0, 100 - (thirtySecondIntervals * 5));
    }
    const completionBonus = completionBonusMap[level.toLowerCase()];
    const shortestLength = shortestSolution.length;
    const userLength = completeLadder.length;
    const wordBonus = Math.max(0, 100 - (userLength - shortestLength) * 5);
    const totalScore = completionBonus + wordBonus + timeBonus;

    // Stat deltas (only available on fresh completion, not when revisiting)
    const newTotalScore = prevStats != null ? prevStats.totalScore + totalScore : null;
    const isNewHighScore = prevStats != null ? totalScore > prevStats.highScore : false;
    const newStreak = prevStats != null ? prevStats.currentStreak + 1 : null;
    const streakIncreased = prevStats != null && newStreak > prevStats.currentStreak;
    
    const displayLadder = showShortest ? shortestSolution : completeLadder;

    // Check if user hasn't been asked about notifications yet
    useEffect(() => {
        const hasBeenAsked = currentUser?.notifications?.hasBeenAskedForNotifications;
        const notificationsEnabled = currentUser?.notifications?.enabled;
        
        // Only show prompt if: not asked before and notifications not already enabled
        if (!hasBeenAsked && !notificationsEnabled) {
            // Delay to show after score animations
            setTimeout(() => {
                showNotificationPrompt();
            }, 4500);
        }
    }, []);

    const showNotificationPrompt = () => {
        Alert.alert(
            "🎉 Great Job!",
            "Would you like to receive daily notifications when new puzzles are available?",
            [
                {
                    text: "Not Now",
                    style: "cancel",
                    onPress: async () => {
                        // Mark as asked so we don't show again
                        await markAsAsked();
                    }
                },
                {
                    text: "Yes, Notify Me!",
                    onPress: async () => {
                        await enableNotifications();
                    }
                }
            ]
        );
    };

    const markAsAsked = async () => {
        try {
            const auth = getAuth();
            const updatedUser = {
                ...currentUser,
                notifications: {
                    ...currentUser.notifications,
                    hasBeenAskedForNotifications: true
                }
            };
            await dispatch(updateUser(currentUser.id, updatedUser, auth));
        } catch (error) {
            console.error('Error marking notification prompt as shown:', error);
        }
    };

    const enableNotifications = async () => {
        try {
            const hasPermission = await checkNotificationPermissions();
            const token = await registerForPushNotificationsAsync();
            
            if (token) {
                const auth = getAuth();
                const updatedUser = {
                    ...currentUser,
                    notifications: {
                        enabled: true,
                        expoPushToken: token,
                        hasBeenAskedForNotifications: true
                    }
                };
                
                await dispatch(updateUser(currentUser.id, updatedUser, auth));
                
                Alert.alert(
                    "✅ Notifications Enabled",
                    "You'll receive a daily reminder if you haven't played today's puzzle!"
                );
            } else {
                // Permission denied/blocked or token retrieval failed
                Alert.alert(
                    "Notifications Blocked",
                    hasPermission
                        ? "Failed to register for notifications right now. Please try again from the Profile page."
                        : "Please enable notifications in Settings to receive daily puzzle reminders.",
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: async () => await markAsAsked()
                        },
                        {
                            text: "Open Settings",
                            onPress: async () => {
                                await Linking.openSettings();
                                await markAsAsked();
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
            Alert.alert("Error", "Failed to enable notifications. You can try again from the Profile page.");
            await markAsAsked();
        }
    };

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
                <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingTop: 10, paddingBottom: 6, fontSize: 24 }}>
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
                        {`Round Score: `}
                    </Text>
                    <Animatable.View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} animation="bounceInRight" duration={2000} delay={3500}>
                        <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 10, fontSize: 18  }}>
                            {`${totalScore}`}
                        </Text>
                    </Animatable.View>
                </View>
            </View>

            {/* Stat Deltas — only shown on fresh completion */}
            {prevStats != null && (
                <View style={{ width: '100%', alignItems: 'center', marginTop: 4, gap: 6 }}>

                    {/* New High Score Banner */}
                    {isNewHighScore && (
                        <Animatable.View
                            animation="bounceIn"
                            duration={1000}
                            delay={4200}
                            style={styles.highScoreBanner}
                        >
                            <Text style={styles.highScoreBannerText}>🏆 New High Score!</Text>
                        </Animatable.View>
                    )}

                    {/* Streak increase */}
                    {streakIncreased && (
                        <Animatable.View
                            animation="fadeInUp"
                            duration={600}
                            delay={4400}
                            style={styles.statDeltaRow}
                        >
                            <Text style={styles.statDeltaText}>
                                🔥 Streak: {prevStats.currentStreak} → <Text style={{ color: '#FF6B35', fontWeight: '800' }}>{newStreak}</Text>
                            </Text>
                        </Animatable.View>
                    )}

                    {/* Total score delta */}
                    <Animatable.View
                        animation="fadeInUp"
                        duration={600}
                        delay={4600}
                        style={styles.statDeltaRow}
                    >
                        <Text style={styles.statDeltaText}>
                            {'Total Score: '}{prevStats.totalScore}{' → '}
                            <Text style={{ color: '#34C759', fontWeight: '800' }}>{newTotalScore}</Text>
                            {'  '}
                            <Text style={{ color: '#34C759', fontWeight: '700' }}>(+{totalScore})</Text>
                        </Text>
                    </Animatable.View>
                </View>
            )}
            
            {/* Share Button */}
            <Animatable.View 
                animation="bounceIn" 
                duration={1500} 
                delay={prevStats != null ? 5000 : 4000}
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
    highScoreBanner: {
        backgroundColor: '#FFD700',
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 20,
        shadowColor: '#B8860B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        elevation: 4,
    },
    highScoreBannerText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#5A3E00',
        letterSpacing: 0.4,
    },
    statDeltaRow: {
        backgroundColor: '#F2F2F7',
        paddingVertical: 7,
        paddingHorizontal: 20,
        borderRadius: 12,
        minWidth: '70%',
        alignItems: 'center',
    },
    statDeltaText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
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
        marginTop: 10,
        marginHorizontal: 20,
        marginBottom: 30,
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