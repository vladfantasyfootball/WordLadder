import React, { useState, useEffect, useMemo } from 'react'
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
    const [firstTimeLevel, setFirstTimeLevel] = useState(null);

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
            // Shift by 7h so day boundary matches puzzle reset (UTC 07:00 = 11 PM PT)
            const now = new Date();
            const currentUTCDate = new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString().split('T')[0];
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
            // Shift by 7h so day boundary matches puzzle reset (UTC 07:00 = 11 PM PT)
            const now = new Date();
            const currentUTCDate = new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString().split('T')[0];
            if(currentUser?.ad?.dateWatched === currentUTCDate && currentUser?.ad?.adWatched){
                setAdWatched(true)
            }
        }
        const unsubscribeRewardedInterstitial = loadRewardedInterstitial()

        return () => {
            unsubscribeRewardedInterstitial();
        }
    },[currentUser])

    const isPremium = currentUser?.purchases?.premium === true;

    const navigateToPlay = (level) => {
        if(level.toLowerCase() === "two" && !adWatched && !isPremium){
            rewardedInterstitialAd.show().then(() => {StatusBar.setStatusBarHidden(true)});
        } else if (level.toLowerCase() === "three" && !isPremium) {
            navigation.navigate('Paywall');
        } else {
            navigation.navigate('Play', {
                level,
                onShowRules: () => setHowToOpen(level)
            });
        }
    }

    const onPressPlay = (level) => {
        if (level.toLowerCase() === 'three' && !isPremium) {
            navigation.navigate('Paywall');
            return;
        }
        const hasEverPlayed = (currentUser?.wordLadder[level.toLowerCase()]?.totalAttempted ?? 0) > 0;
        if (!hasEverPlayed) {
            // First time — show rules, with a play button at the bottom
            setFirstTimeLevel(level);
            setHowToOpen(level);
        } else {
            navigateToPlay(level);
        }
    }

    const onPressUnlock = () => {
        navigation.navigate('Paywall')
    }

    const onPressHowTo = (level) => {
        setHowToOpen(level)
    }
    
    const buttonText = useMemo(() => {
        if (level.toLowerCase() === 'three' && !isPremium) return 'Unlock Level Three 🔒';
        const levelData = currentUser?.wordLadder[level.toLowerCase()];
        const isCompleted = levelData?.currentWordLadder?.completed;
        const hasStarted = levelData?.currentWordLadder?.currentAttempt?.length > 1;
        if (isCompleted) return 'View Solution';
        if (hasStarted) return `Resume Level ${level}`;
        return `Play Level ${level}`;
    }, [currentUser, level, isPremium]);

    const determineLevelDisabled = (level) => {
        if(level.toLowerCase() === "two"){
            return (!adLoaded && !adWatched && !isPremium)
        } else {
            return false
        }
    }

    return (
            <View style={[styles.container, {backgroundColor: levelColorScheme[level]}]}>
                {howToOpen !== null 
                    ? 
                        <ScrollView persistentScrollbar={true} contentContainerStyle={{backgroundColor: levelColorScheme[level], width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 10, paddingBottom: 20, paddingHorizontal: 20 }}>
                            <Text style={{ fontWeight: '800', textAlign: 'center', paddingBottom: 16, fontSize: 22, color: '#5B5A53' }}>
                                {`Level ${level} Rules`}
                            </Text>
                            {level.toLowerCase() === "one" ? <>
                                    <Text style={{ textAlign: 'center', paddingBottom: 16, fontSize: 15, color: '#5B5A53', lineHeight: 22 }}>
                                        {`Change one letter at a time to get from the top word to the bottom word.`}
                                    </Text>
                                    <View style={{ backgroundColor: 'white', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, width: '100%', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
                                        <Text style={{ fontSize: 28, paddingBottom: 6 }}>✏️</Text>
                                        <Text style={{ fontWeight: '800', fontSize: 17, color: '#5B5A53', paddingBottom: 4 }}>
                                            {`Change one letter`}
                                        </Text>
                                        <Text style={{ fontSize: 14, color: '#5B5A53', textAlign: 'center', lineHeight: 20, paddingBottom: 10 }}>
                                            {`Swap exactly one letter to make a new word`}
                                        </Text>
                                        <Text style={{ fontWeight: '700', fontSize: 16, color: '#5B5A53', letterSpacing: 1 }}>
                                            {`bike → bake`}
                                        </Text>
                                    </View>
                                    <Text style={{ fontWeight: '700', fontSize: 14, color: '#5B5A53', textAlign: 'center', paddingTop: 4 }}>
                                        {`⚡ Fewer words & faster time = higher score`}
                                    </Text>
                                </>
                            : level.toLowerCase() === "two" ? <>
                                    <Text style={{ textAlign: 'center', paddingBottom: 16, fontSize: 15, color: '#5B5A53', lineHeight: 22 }}>
                                        {`All the same rules as Level One — plus one new move:`}
                                    </Text>
                                    <View style={{ backgroundColor: 'white', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, width: '100%', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
                                        <Text style={{ fontSize: 28, paddingBottom: 6 }}>🔀</Text>
                                        <Text style={{ fontWeight: '800', fontSize: 17, color: '#5B5A53', paddingBottom: 4 }}>
                                            {`Anagram`}
                                        </Text>
                                        <Text style={{ fontSize: 14, color: '#5B5A53', textAlign: 'center', lineHeight: 20, paddingBottom: 10 }}>
                                            {`Rearrange all the letters to make a new word`}
                                        </Text>
                                        <Text style={{ fontWeight: '700', fontSize: 16, color: '#5B5A53', letterSpacing: 1 }}>
                                            {`bake → beak`}
                                        </Text>
                                    </View>
                                    <Text style={{ fontWeight: '700', fontSize: 14, color: '#5B5A53', textAlign: 'center', paddingTop: 4 }}>
                                        {`⚡ Fewer words & faster time = higher score`}
                                    </Text>
                                </>
                            : level.toLowerCase() === "three" && <>
                                    <Text style={{ textAlign: 'center', paddingBottom: 16, fontSize: 15, color: '#5B5A53', lineHeight: 22 }}>
                                        {`All the same rules as Level Two — plus two new moves:`}
                                    </Text>
                                    <View style={{ backgroundColor: 'white', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, width: '100%', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
                                        <Text style={{ fontSize: 28, paddingBottom: 6 }}>➕</Text>
                                        <Text style={{ fontWeight: '800', fontSize: 17, color: '#5B5A53', paddingBottom: 4 }}>
                                            {`Add a Letter`}
                                        </Text>
                                        <Text style={{ fontSize: 14, color: '#5B5A53', textAlign: 'center', lineHeight: 20, paddingBottom: 10 }}>
                                            {`Insert one letter anywhere to make a new word`}
                                        </Text>
                                        <Text style={{ fontWeight: '700', fontSize: 16, color: '#5B5A53', letterSpacing: 1 }}>
                                            {`bake → brake`}
                                        </Text>
                                    </View>
                                    <View style={{ backgroundColor: 'white', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, width: '100%', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
                                        <Text style={{ fontSize: 28, paddingBottom: 6 }}>➖</Text>
                                        <Text style={{ fontWeight: '800', fontSize: 17, color: '#5B5A53', paddingBottom: 4 }}>
                                            {`Remove a Letter`}
                                        </Text>
                                        <Text style={{ fontSize: 14, color: '#5B5A53', textAlign: 'center', lineHeight: 20, paddingBottom: 10 }}>
                                            {`Remove one letter to make a new word`}
                                        </Text>
                                        <Text style={{ fontWeight: '700', fontSize: 16, color: '#5B5A53', letterSpacing: 1 }}>
                                            {`brake → bake`}
                                        </Text>
                                    </View>
                                    <Text style={{ fontWeight: '700', fontSize: 14, color: '#5B5A53', textAlign: 'center', paddingBottom: 8 }}>
                                        {`Words can be 4 to 6 letters long.`}
                                    </Text>
                                    <Text style={{ fontWeight: '700', fontSize: 14, color: '#5B5A53', textAlign: 'center', paddingTop: 4 }}>
                                        {`⚡ Fewer words & faster time = higher score`}
                                    </Text>
                                </>
                            }
                            
                            {firstTimeLevel !== null
                                ? <FlatButton text="Got it, Let's Play!" onPress={() => { setHowToOpen(null); setFirstTimeLevel(null); navigateToPlay(level); }} width='60' disabled={false}/>
                                : <FlatButton text='Close Rules' onPress={() => onPressHowTo(null)} width='40' disabled={false}/>
                            }
                        </ScrollView>
                    : 
                        <>
                            <FlatButton text={buttonText} onPress={() => {onPressPlay(level)}} width='60' disabled={determineLevelDisabled(level)}/>
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