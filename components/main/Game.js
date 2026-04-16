import React, { useState, useEffect, useMemo, useRef } from 'react'
import { View, StyleSheet, Text, ScrollView, Platform, TouchableOpacity, Alert} from 'react-native'
import FlatButton from '../shared/button';
import TutorialModal from '../shared/TutorialModal';
import { levelColorScheme } from '../../redux/constants/colorScheme';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../redux/actions';
import {RewardedInterstitialAd, TestIds, RewardedAdEventType, AdEventType} from 'react-native-google-mobile-ads'
import * as StatusBar from 'expo-status-bar';
import { getAuth } from 'firebase/auth';
import { adsInitialized } from '../../utils/ads';

const REWARDED_INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED_INTERSTITIAL
  : Platform.OS === 'android'
    ? 'ca-app-pub-5826991812725211/2952492979'
    : 'ca-app-pub-5826991812725211/8265105651';

// Yesterday's Solution ad — create new Rewarded Interstitial ad units in AdMob
// and replace the placeholder IDs below.
const YESTERDAY_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED_INTERSTITIAL
  : Platform.OS === 'android'
    ? 'ca-app-pub-5826991812725211/7638810307'
    : 'ca-app-pub-5826991812725211/4459768188';

// Ad objects are created after SDK is initialized to avoid silent load failures
let rewardedInterstitialAd;
let yesterdayAd;
let pendingYesterdayLevel = null;
// Module-level vars avoid stale closure in ad event listeners
let shuffleAdRewardEarned = false;
let pendingTutorialAfterAd = false;
adsInitialized
  .then(() => {
    rewardedInterstitialAd = RewardedInterstitialAd.createForAdRequest(REWARDED_INTERSTITIAL_AD_UNIT_ID);
    yesterdayAd = RewardedInterstitialAd.createForAdRequest(YESTERDAY_AD_UNIT_ID);
  })
  .catch(() => {});

const levelDisplayName = { One: 'Classic', Two: 'Shuffle', Three: 'Morph' };

export default function Game({ navigation, level, route }) {
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => {return state.userState.currentUser});
    const [adWatched, setAdWatched] = useState(false)

    const [adLoaded, setAdLoaded] = useState(false)
    const [adLoadFailed, setAdLoadFailed] = useState(false)
    const [yesterdayAdLoaded, setYesterdayAdLoaded] = useState(false)
    const [yesterdayAdLoadFailed, setYesterdayAdLoadFailed] = useState(false)

    const wordLadder = useSelector((state) => state.wordLadderState.wordLadder);
    const [showTutorial, setShowTutorial] = useState(false);
    const adCleanupRef = useRef(null);

    const loadYesterdayAd = () => {
        if (!yesterdayAd) return () => {};
        const unsubscribeLoaded = yesterdayAd.addAdEventListener(
          RewardedAdEventType.LOADED, () => {
            setYesterdayAdLoaded(true);
            setYesterdayAdLoadFailed(false);
          }
        );
        const unsubscribeEarned = yesterdayAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD, () => {
            if (pendingYesterdayLevel === level) {
              navigation.navigate('YesterdaySolution', { level });
            }
          }
        );
        const unsubscribeClosed = yesterdayAd.addAdEventListener(
          AdEventType.CLOSED, () => {
            StatusBar.setStatusBarHidden(false);
            setYesterdayAdLoaded(false);
            yesterdayAd.load();
          }
        );
        const unsubscribeError = yesterdayAd.addAdEventListener(
          AdEventType.ERROR, () => {
            setYesterdayAdLoaded(false);
            setYesterdayAdLoadFailed(true);
          }
        );
        yesterdayAd.load();
        return () => {
          unsubscribeLoaded();
          unsubscribeEarned();
          unsubscribeClosed();
          unsubscribeError();
        };
    };

    const loadRewardedInterstitial = () => {
        if (!rewardedInterstitialAd) return () => {};

        const unsubscribeLoaded = rewardedInterstitialAd.addAdEventListener(
          RewardedAdEventType.LOADED, () => {
            setAdLoaded(true)
            setAdLoadFailed(false)
          }
        )
        const unsubscribeEarned = rewardedInterstitialAd.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD, (reward) => {
            shuffleAdRewardEarned = true; // use module var — no stale closure
            setAdWatched(true)
          }
        )
        const unsubscribeClosed = rewardedInterstitialAd.addAdEventListener(
          AdEventType.CLOSED, () => {
            StatusBar.setStatusBarHidden(false)
            setAdLoaded(false)
            rewardedInterstitialAd.load()

            const earned = shuffleAdRewardEarned;
            shuffleAdRewardEarned = false; // reset for next time

            if (pendingTutorialAfterAd) {
                // First-time Shuffle flow: show tutorial after ad (whether earned or skipped)
                pendingTutorialAfterAd = false;
                setShowTutorial(true);
            } else if (earned) {
                // Returning Shuffle player who earned the reward
                navigation.navigate('Play', { level: 'Two' });
            }
          }
        )
        const unsubscribeError = rewardedInterstitialAd.addAdEventListener(
          AdEventType.ERROR, () => {
            setAdLoaded(false)
            setAdLoadFailed(true)
          }
        )

        rewardedInterstitialAd.load()
    
        return () => {
          unsubscribeLoaded()
          unsubscribeClosed()
          unsubscribeEarned()
          unsubscribeError()
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
        // Clean up any previously-registered listeners before adding new ones.
        // This is necessary because the cleanup must be returned from useEffect itself,
        // not from inside the .then() callback (which React never calls as cleanup).
        if (adCleanupRef.current) {
            adCleanupRef.current();
            adCleanupRef.current = null;
        }

        // Wait for SDK init then start loading ad
        adsInitialized.then(() => {
            // Only the Shuffle tab owns the rewarded interstitial — avoids duplicate listeners
            const unsubA = level === 'Two' ? loadRewardedInterstitial() : () => {};
            const unsubB = loadYesterdayAd();
            adCleanupRef.current = () => { unsubA(); unsubB(); };
        });

        return () => {
            if (adCleanupRef.current) {
                adCleanupRef.current();
                adCleanupRef.current = null;
            }
        };
    },[currentUser])

    const isPremium = currentUser?.purchases?.premium === true;

    // Today's puzzle ID — used to hide the button on day 1
    const todayPuzzleId = wordLadder?.[level.toLowerCase()]?.id ?? 1;

    const onPressYesterday = () => {
        if (isPremium || yesterdayAdLoadFailed || !yesterdayAdLoaded) {
            navigation.navigate('YesterdaySolution', { level });
            return;
        }
        if (yesterdayAd && yesterdayAdLoaded) {
            pendingYesterdayLevel = level;
            yesterdayAd.show().then(() => StatusBar.setStatusBarHidden(true));
        }
    };

    const navigateToPlay = (level) => {
        if(level.toLowerCase() === "two" && !adWatched && !isPremium && !adLoadFailed){
            if (rewardedInterstitialAd) {
                rewardedInterstitialAd.show().then(() => {StatusBar.setStatusBarHidden(true)});
            }
        } else if (level.toLowerCase() === "three" && !isPremium) {
            navigation.navigate('Paywall');
        } else {
            navigation.navigate('Play', { level });
        }
    }

    const onPressPlay = (level) => {
        if (level.toLowerCase() === 'three' && !isPremium) {
            navigation.navigate('Paywall');
            return;
        }
        const lvl = currentUser?.wordLadder[level.toLowerCase()];
        const hasEverPlayed = lvl?.lastAttempted != null
            || (lvl?.totalAttempted ?? 0) > 0
            || (lvl?.totalSolved ?? 0) > 0
            || (lvl?.highScore ?? 0) > 0
            || lvl?.timeStarted != null
            || lvl?.currentWordLadder?.currentAttempt?.length > 0;
        if (!hasEverPlayed) {
            // Prerequisite gate: must have started previous level at least once.
            // Check every possible signal — totalAttempted, lastAttempted, totalSolved,
            // highScore, timeStarted — so any evidence of past play unlocks the gate.
            if (level === 'Two') {
                const one = currentUser?.wordLadder?.one;
                const hasStartedClassic = one?.lastAttempted != null
                    || (one?.totalAttempted ?? 0) > 0
                    || (one?.totalSolved ?? 0) > 0
                    || (one?.highScore ?? 0) > 0
                    || one?.timeStarted != null
                    || one?.currentWordLadder?.currentAttempt?.length > 0;
                if (!hasStartedClassic) {
                    Alert.alert('Play Classic First', 'Try a Classic puzzle before unlocking Shuffle.');
                    return;
                }
            }
            if (level === 'Three') {
                const two = currentUser?.wordLadder?.two;
                const hasStartedShuffle = two?.lastAttempted != null
                    || (two?.totalAttempted ?? 0) > 0
                    || (two?.totalSolved ?? 0) > 0
                    || (two?.highScore ?? 0) > 0
                    || two?.timeStarted != null
                    || two?.currentWordLadder?.currentAttempt?.length > 0;
                if (!hasStartedShuffle) {
                    Alert.alert('Play Shuffle First', 'Try a Shuffle puzzle before unlocking Morph.');
                    return;
                }
            }
            // First time on this level
            if (level === 'Two' && !adWatched && !isPremium && adLoaded) {
                // Show the ad first, tutorial will appear after CLOSED fires
                pendingTutorialAfterAd = true;
                rewardedInterstitialAd.show().then(() => StatusBar.setStatusBarHidden(true));
            } else {
                setShowTutorial(true);
            }
        } else {
            navigateToPlay(level);
        }
    }

    const onPressUnlock = () => {
        navigation.navigate('Paywall')
    }

    
    const buttonText = useMemo(() => {
        if (level.toLowerCase() === 'three' && !isPremium) return 'Unlock Morph 🔒';
        const levelData = currentUser?.wordLadder[level.toLowerCase()];
        const isCompleted = levelData?.currentWordLadder?.completed;
        const hasStarted = levelData?.currentWordLadder?.currentAttempt?.length > 1;
        if (isCompleted) return 'View Solution';
        if (hasStarted) return `Resume ${levelDisplayName[level]}`;
        return `Play ${levelDisplayName[level]}`;
    }, [currentUser, level, isPremium]);

    const lvlData = currentUser?.wordLadder[level.toLowerCase()];
    const hasEverAttempted = lvlData?.lastAttempted != null
        || (lvlData?.totalAttempted ?? 0) > 0
        || (lvlData?.totalSolved ?? 0) > 0
        || (lvlData?.highScore ?? 0) > 0
        || lvlData?.timeStarted != null
        || lvlData?.currentWordLadder?.currentAttempt?.length > 0;

    const determineLevelDisabled = (level) => {
        if(level.toLowerCase() === "two"){
            return (!adLoaded && !adWatched && !isPremium && !adLoadFailed)
        } else {
            return false
        }
    }

    return (
            <View style={[styles.container, {backgroundColor: levelColorScheme[level]}]}>
                <FlatButton text={buttonText} onPress={() => {onPressPlay(level)}} width='60' disabled={determineLevelDisabled(level)}/>
                            {/* {level === 'Two' && 
                                <FlatButton text={`Unlock Level Two`} onPress={onPressUnlock} width='50' disabled={false}/> 
                            } */}
                            {hasEverAttempted && (
                                <FlatButton text='How to Play' onPress={() => setShowTutorial(true)} width='40' disabled={false}/>
                            )}
                            {todayPuzzleId >= 2 && (
                                <View style={styles.yesterdayContainer}>
                                    <TouchableOpacity
                                        onPress={onPressYesterday}
                                        style={styles.yesterdayButton}
                                    >
                                        <Text style={styles.yesterdayButtonText}>Yesterday's Solution</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                <TutorialModal
                    level={level}
                    visible={showTutorial}
                    onComplete={() => {
                        setShowTutorial(false);
                        navigation.navigate('Play', { level });
                    }}
                />
                
            </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    yesterdayContainer: {
        position: 'absolute',
        bottom: 52,
        alignItems: 'center',
        width: '100%',
    },
    yesterdayButton: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 20,
    },
    yesterdayButtonText: {
        color: '#5B5A53',
        fontWeight: '600',
        fontSize: 13,
        textAlign: 'center',
    },
});