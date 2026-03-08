import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Text, ScrollView} from 'react-native'
import FlatButton from '../shared/button';
import { levelColorScheme } from '../../redux/constants/colorScheme';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../redux/actions';
import {RewardedInterstitialAd, TestIds, RewardedAdEventType, AdEventType} from 'react-native-google-mobile-ads'
import * as StatusBar from 'expo-status-bar';
import { getAuth } from 'firebase/auth';

const rewardedInterstitialAd = RewardedInterstitialAd.createForAdRequest(TestIds.REWARDED_INTERSTITIAL, {
    requestNonPersonalizedAdsOnly: true
  });

export default function Game({ navigation, level, route }) {
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => {return state.userState.currentUser});
    const [adWatched, setAdWatched] = useState(false)

    const [adLoaded, setAdLoaded] = useState(false)

    const wordLadder = useSelector((state) => state.wordLadderState.wordLadder);
    const [howToOpen, setHowToOpen] = useState(null);

    const loadRewardedInterstitial = () => {
        const unsubscribeLoaded = rewardedInterstitialAd.addAdEventListener(
          RewardedAdEventType.LOADED, () => {
            setAdLoaded(true)
          }
        )
        const unsubscribeEarned = rewardedInterstitialAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD, (reward) => {
            setAdWatched(true)
          }
        )
        const unsubscribeClosed = rewardedInterstitialAd.addAdEventListener(
          AdEventType.CLOSED, () => {
            StatusBar.setStatusBarHidden(false)
            setAdLoaded(false)
            rewardedInterstitialAd.load()

            if(adWatched){
                navigation.navigate('Play', {level: 'Two'});
            }
          }
        )
    
        rewardedInterstitialAd.load()
    
        return () => {
          unsubscribeLoaded()
          unsubscribeClosed()
          unsubscribeEarned()
        }
    }

    useEffect(() => {
        if(currentUser && adWatched){
            // Use UTC date format (YYYY-MM-DD) for consistent timezone handling
            const currentUTCDate = new Date().toISOString().split('T')[0];
            dispatch(updateUser(
                currentUser.id, {...currentUser, 
                    ad: {
                        adWatched: true,
                        dateWatched: currentUTCDate
                    }
                }, getAuth()
            ))
        }
    },[adWatched])
    
    useEffect(() => {
        if(currentUser){
            // Use UTC date format (YYYY-MM-DD) for consistent timezone handling
            const currentUTCDate = new Date().toISOString().split('T')[0];
            if(currentUser?.ad?.dateWatched === currentUTCDate && currentUser?.ad?.adWatched){
                setAdWatched(true)
            }
        }
        const unsubscribeRewardedInterstitial = loadRewardedInterstitial()

        // Listen for navigation events to show rules
        const unsubscribeFocus = navigation.addListener('focus', () => {
            if (route.params?.showRules) {
                setHowToOpen(route.params.level);
                // Clear the param after handling
                navigation.setParams({ showRules: undefined });
            }
        });

        return () => {
            unsubscribeRewardedInterstitial();
            unsubscribeFocus();
        }
    },[currentUser, navigation, route.params])

    const onPressPlay = ( level ) => {
        if(level.toLowerCase() === "two" && !adWatched){
            rewardedInterstitialAd.show().then(() => {StatusBar.setStatusBarHidden(true)});
        } else {
            navigation.navigate('Play', {
                level,
                parentScreen: 'Game'
            });
        }
    }

    const onPressUnlock = () => {
        navigation.navigate('Paywall')
    }

    const onPressHowTo = (level) => {
        setHowToOpen(level)
    }
    
    const getButtonText = (level) => {
        const levelData = currentUser?.wordLadder[level.toLowerCase()];
        const isCompleted = levelData?.currentWordLadder?.completed;
        const hasStarted = levelData?.currentWordLadder?.currentAttempt?.length > 1;
        
        if (isCompleted) {
            return 'View Solution';
        }
        if (hasStarted) {
            return `Resume Level ${level}`;
        }
        return `Play Level ${level}`;
    }

    const determineLevelDisabled = (level) => {
        if(level.toLowerCase() === "two"){
            return (currentUser?.wordLadder['one'].currentWordLadder.completed === false || (!adLoaded && !adWatched))
        } else {
            return false
        }
    }

    return (
            <View style={[styles.container, {backgroundColor: levelColorScheme[level]}]}>
                {howToOpen !== null 
                    ? 
                        <ScrollView persistentScrollbar={true} contentContainerStyle={{backgroundColor: levelColorScheme[level], width: '100%', maxHeight: '750px', display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 5 }}>
                            <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 10, paddingLeft: 15, fontSize: 24, color: '#5B5A53' }}>
                                {`Level ${level} Rules:`}
                            </Text>
                            {level.toLowerCase() === "one" && 
                                <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 10, paddingLeft: 15, fontSize: 14, color: '#5B5A53' }}>
                                    {`Your goal is to get from the starting word(top of page) to the ending word(bottom of page) one step at a time.`}
                                </Text>
                            }
                            <Text style={{ fontWeight: 'bold', alignItems: 'center', padding: 10, paddingLeft: 15, fontSize: 14, color: '#5B5A53' }}>
                                {`For Level ${level}, you have the following operations available to you:`}
                            </Text>
                            {level.toLowerCase() === "one" ? 
                                <>
                                    <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingLeft: 40, paddingRight: 15, paddingBottom: 10, fontSize: 14, color: '#5B5A53' }}>
                                        {`1.Change one letter at a time (i.e. from bike you can make bake)`}
                                    </Text>
                                    <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingLeft: 15, paddingRight: 15, paddingBottom: 10, fontSize: 14, color: '#5B5A53' }}>
                                        {`So an example of a completed Level One word ladder with starting word "coat" and ending word "lake" would be:`}
                                    </Text>
                                    <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingLeft: 40, paddingRight: 40, paddingBottom: 10, fontSize: 14, color: '#5B5A53' }}>
                                        {`coat -> cost -> cast -> case -> cake -> lake`}
                                    </Text>
                                    <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingLeft: 15, paddingRight: 15, paddingBottom: 10, fontSize: 14, color: '#5B5A53' }}>
                                        {`All words have to be real words. And you are scored on how many words you use as well as how long it takes you to complete!`}
                                    </Text>
                                </>
                            : level.toLowerCase() === "two" && 
                                <>
                                    <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingLeft: 40, paddingRight: 15, paddingBottom: 10, fontSize: 14, color: '#5B5A53' }}>
                                        {`1.Change one letter at a time (i.e. from bike you can make bake)`}
                                    </Text>
                                    <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingLeft: 40, paddingRight: 15, paddingBottom: 10, fontSize: 14, color: '#5B5A53' }}>
                                        {`or`}
                                    </Text>
                                    <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingLeft: 40, paddingRight: 15, paddingBottom: 10, fontSize: 14, color: '#5B5A53' }}>
                                        {`2.Rearrange all letters in word to change to different word. (i.e. from "bake" you can make "beak")`}
                                    </Text>
                                    <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingLeft: 15, paddingRight: 15, paddingBottom: 10, fontSize: 14, color: '#5B5A53' }}>
                                        {`So an example of a completed Level Two word ladder with starting word "safe" and ending word "open" would be:`}
                                    </Text>
                                    <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingLeft: 40, paddingRight: 40, paddingBottom: 10, fontSize: 14, color: '#5B5A53' }}>
                                        {`safe -> sale -> sole -> sore -> rose -> nose -> nope -> open`}
                                    </Text>
                                    <Text style={{ fontWeight: 'bold', alignItems: 'center', paddingLeft: 15, paddingRight: 15, paddingBottom: 10, fontSize: 14, color: '#5B5A53' }}>
                                        {`All words have to be real words. And you are scored on how many words you use as well as how long it takes you to complete!`}
                                    </Text>
                                </>
                                
                            }
                            
                            <FlatButton text='Close Rules' onPress={() => onPressHowTo(null)} width='40' disabled={false}/>
                        </ScrollView>
                    : 
                        <>
                            <FlatButton text={getButtonText(level)} onPress={() => {onPressPlay(level)}} width='60' disabled={determineLevelDisabled(level)}/>
                            {/* {level === 'Two' && 
                                <FlatButton text={`Unlock Level Two`} onPress={onPressUnlock} width='50' disabled={false}/> 
                            } */}
                            <FlatButton text='How to Play' onPress={() => onPressHowTo(level)} width='40' disabled={false}/>
                        </> 
                }
                
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