import React, { useState, useEffect, useMemo, useRef } from 'react'
import { View, StyleSheet, Text, ScrollView, Platform, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native'
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

// Morph (Level 3) ad — replace placeholder IDs with real AdMob units
const MORPH_AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED_INTERSTITIAL
  : Platform.OS === 'android'
    ? 'ca-app-pub-5826991812725211/3716829168'
    : 'ca-app-pub-5826991812725211/5029910836';

// Ad objects are created after SDK is initialized to avoid silent load failures
let rewardedInterstitialAd;
let yesterdayAd;
let morphAd;
let pendingYesterdayLevel = null;
// Module-level vars avoid stale closure in ad event listeners
let shuffleAdRewardEarned = false;
let pendingTutorialAfterAd = false;
let morphAdRewardEarned = false;
let pendingMorphTutorialAfterAd = false;
// Module-level loaded flags — independent of component lifecycle
let rewardedAdReady = false;
let morphAdReady = false;
let yesterdayAdReady = false;
adsInitialized
  .then(() => {
    rewardedInterstitialAd = RewardedInterstitialAd.createForAdRequest(REWARDED_INTERSTITIAL_AD_UNIT_ID);
    yesterdayAd = RewardedInterstitialAd.createForAdRequest(YESTERDAY_AD_UNIT_ID);
    morphAd = RewardedInterstitialAd.createForAdRequest(MORPH_AD_UNIT_ID);

    // LOADED/ERROR/EARNED_REWARD registered once at module level — never torn down
    rewardedInterstitialAd.addAdEventListener(RewardedAdEventType.LOADED, () => { rewardedAdReady = true; });
    rewardedInterstitialAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => { shuffleAdRewardEarned = true; });
    rewardedInterstitialAd.addAdEventListener(AdEventType.ERROR, () => {
        rewardedAdReady = false;
        setTimeout(() => rewardedInterstitialAd.load(), 5000);
    });

    morphAd.addAdEventListener(RewardedAdEventType.LOADED, () => { morphAdReady = true; });
    morphAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => { morphAdRewardEarned = true; });
    morphAd.addAdEventListener(AdEventType.ERROR, () => {
        morphAdReady = false;
        setTimeout(() => morphAd.load(), 5000);
    });

    yesterdayAd.addAdEventListener(RewardedAdEventType.LOADED, () => { yesterdayAdReady = true; });
    yesterdayAd.addAdEventListener(AdEventType.ERROR, () => {
        yesterdayAdReady = false;
        setTimeout(() => yesterdayAd.load(), 5000);
    });
  })
  .catch(() => {});

const levelDisplayName = { One: 'Classic', Two: 'Shuffle', Three: 'Morph' };

export default function Game({ navigation, level, route }) {
    const dispatch = useDispatch();
    const currentUser = useSelector((state) => {return state.userState.currentUser});
    const [adWatched, setAdWatched] = useState(false)
    const [morphAdWatched, setMorphAdWatched] = useState(false)

    const wordLadder = useSelector((state) => state.wordLadderState.wordLadder);
    const [showTutorial, setShowTutorial] = useState(false);
    const adCleanupRef = useRef(null);
    const [consentModal, setConsentModal] = useState(null); // { type: 'shuffle'|'yesterday'|'morph', action: any }
    const [consentCountdown, setConsentCountdown] = useState(3);
    const consentIntervalRef = useRef(null);

    // Only registers CLOSED for navigation — LOADED/ERROR/EARNED_REWARD are at module level
    const loadYesterdayAd = () => {
        if (!yesterdayAd) return () => {};
        const unsubscribeClosed = yesterdayAd.addAdEventListener(
          AdEventType.CLOSED, () => {
            StatusBar.setStatusBarHidden(false);
            yesterdayAdReady = false;
            yesterdayAd.load();
            if (pendingYesterdayLevel) {
                navigation.navigate('YesterdaySolution', { level: pendingYesterdayLevel });
                pendingYesterdayLevel = null;
            }
          }
        );
        if (!yesterdayAdReady) yesterdayAd.load();
        return () => { unsubscribeClosed(); };
    };

    const loadRewardedInterstitial = () => {
        if (!rewardedInterstitialAd) return () => {};
        const unsubscribeClosed = rewardedInterstitialAd.addAdEventListener(
          AdEventType.CLOSED, () => {
            StatusBar.setStatusBarHidden(false);
            rewardedAdReady = false;
            rewardedInterstitialAd.load();
            // pre-warm morph for the natural next level
            morphAdReady = false;
            morphAd.load();

            const earned = shuffleAdRewardEarned;
            shuffleAdRewardEarned = false;
            if (earned) setAdWatched(true);

            if (pendingTutorialAfterAd) {
                pendingTutorialAfterAd = false;
                setTimeout(() => setShowTutorial(true), 150);
            } else {
                setTimeout(() => navigation.navigate('Play', { level: 'Two' }), 150);
            }
          }
        );
        if (!rewardedAdReady) rewardedInterstitialAd.load();
        return () => { unsubscribeClosed(); };
    };

    const loadMorphAd = () => {
        if (!morphAd) return () => {};
        const unsubscribeClosed = morphAd.addAdEventListener(
          AdEventType.CLOSED, () => {
            StatusBar.setStatusBarHidden(false);
            morphAdReady = false;
            morphAd.load();

            const earned = morphAdRewardEarned;
            morphAdRewardEarned = false;
            if (earned) setMorphAdWatched(true);
            if (pendingMorphTutorialAfterAd) {
                pendingMorphTutorialAfterAd = false;
                setTimeout(() => setShowTutorial(true), 150);
            } else {
                setTimeout(() => navigation.navigate('Play', { level: 'Three' }), 150);
            }
          }
        );
        if (!morphAdReady) morphAd.load();
        return () => { unsubscribeClosed(); };
    };

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
        if (currentUser && morphAdWatched) {
            const now = new Date();
            const currentUTCDate = new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString().split('T')[0];
            dispatch(updateUser(
                currentUser.id, {...currentUser,
                    morphAd: { adWatched: true, dateWatched: currentUTCDate }
                }, getAuth()
            ));
        }
    }, [morphAdWatched])

    // Clean up consent interval on unmount
    useEffect(() => {
        return () => {
            if (consentIntervalRef.current) clearInterval(consentIntervalRef.current);
        };
    }, []);

    const showConsentModal = (type, action) => {
        if (consentIntervalRef.current) return; // already counting down
        setConsentModal({ type, action });
        setConsentCountdown(3);
        consentIntervalRef.current = setInterval(() => {
            setConsentCountdown(prev => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
    };

    const cancelConsent = () => {
        if (consentIntervalRef.current) { clearInterval(consentIntervalRef.current); consentIntervalRef.current = null; }
        setConsentModal(null);
        setConsentCountdown(3);
    };

    // Fire the ad (or skip) when countdown reaches 0
    useEffect(() => {
        if (consentCountdown !== 0 || !consentModal) return;
        if (consentIntervalRef.current) { clearInterval(consentIntervalRef.current); consentIntervalRef.current = null; }
        const { type, action } = consentModal;
        setConsentModal(null);
        setConsentCountdown(3);

        if (type === 'shuffle') {
            if (rewardedAdReady) {
                if (action?.isTutorial) pendingTutorialAfterAd = true;
                setTimeout(() => rewardedInterstitialAd.show().then(() => StatusBar.setStatusBarHidden(true)), 150);
            } else {
                if (action?.isTutorial) setShowTutorial(true);
                else navigation.navigate('Play', { level: 'Two' });
            }
        } else if (type === 'morph') {
            if (morphAdReady) {
                if (action?.isTutorial) pendingMorphTutorialAfterAd = true;
                setTimeout(() => morphAd.show().then(() => StatusBar.setStatusBarHidden(true)), 150);
            } else {
                if (action?.isTutorial) setShowTutorial(true);
                else navigation.navigate('Play', { level: 'Three' });
            }
        } else if (type === 'yesterday') {
            if (yesterdayAdReady) {
                pendingYesterdayLevel = action.level;
                setTimeout(() => yesterdayAd.show().then(() => StatusBar.setStatusBarHidden(true)), 150);
            } else {
                navigation.navigate('YesterdaySolution', { level: action.level });
            }
        }
    }, [consentCountdown, consentModal]);
    
    const isPremium = currentUser?.purchases?.premium === true;

    // Separate effect: sync watched-today state without touching ad listeners
    useEffect(() => {
        if (!currentUser) return;
        const now = new Date();
        const currentUTCDate = new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (currentUser?.ad?.dateWatched === currentUTCDate && currentUser?.ad?.adWatched) {
            setAdWatched(true);
        } else {
            setAdWatched(false);
        }
        if (currentUser?.morphAd?.dateWatched === currentUTCDate && currentUser?.morphAd?.adWatched) {
            setMorphAdWatched(true);
        } else {
            setMorphAdWatched(false);
        }
    }, [currentUser?.ad?.dateWatched, currentUser?.ad?.adWatched, currentUser?.morphAd?.dateWatched, currentUser?.morphAd?.adWatched]);

    useEffect(() => {
        // Don't request ads for premium users — they will never be shown one.
        if (isPremium) return;

        // Clean up any previously-registered listeners before adding new ones.
        // This is necessary because the cleanup must be returned from useEffect itself,
        // not from inside the .then() callback (which React never calls as cleanup).
        if (adCleanupRef.current) {
            adCleanupRef.current();
            adCleanupRef.current = null;
        }

        // Wait for SDK init then start loading ad
        adsInitialized.then(() => {
            const unsubA = level === 'Two' ? loadRewardedInterstitial() : () => {};
            const unsubB = loadYesterdayAd();
            const unsubC = level === 'Three' ? loadMorphAd() : () => {};
            adCleanupRef.current = () => { unsubA(); unsubB(); unsubC(); };
        });

        return () => {
            if (adCleanupRef.current) {
                adCleanupRef.current();
                adCleanupRef.current = null;
            }
        };
    },[currentUser?.id, currentUser?.purchases?.premium])

    // Today's puzzle ID — used to hide the button on day 1
    const todayPuzzleId = wordLadder?.[level.toLowerCase()]?.id ?? 1;

    const onPressYesterday = () => {
        if (isPremium) {
            navigation.navigate('YesterdaySolution', { level });
            return;
        }
        showConsentModal('yesterday', { level });
    };

    const navigateToPlay = (level) => {
        if (level.toLowerCase() === "two" && !adWatched && !isPremium) {
            showConsentModal('shuffle', { isTutorial: false });
        } else if (level.toLowerCase() === "three" && !morphAdWatched && !isPremium) {
            showConsentModal('morph', { isTutorial: false });
        } else {
            navigation.navigate('Play', { level });
        }
    }

    const onPressPlay = (level) => {
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
            if (level === 'Two' && !adWatched && !isPremium) {
                showConsentModal('shuffle', { isTutorial: true });
            } else if (level === 'Three' && !morphAdWatched && !isPremium) {
                showConsentModal('morph', { isTutorial: true });
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

    return (
            <View style={[styles.container, {backgroundColor: levelColorScheme[level]}]}>
                <FlatButton text={buttonText} onPress={() => {onPressPlay(level)}} width='60' disabled={false}/>
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

                <Modal
                    visible={!!consentModal}
                    transparent
                    animationType="none"
                    onRequestClose={cancelConsent}
                >
                    <View style={styles.consentOverlay}>
                        <View style={styles.consentCard}>
                            <Text style={styles.consentEmoji}>📺</Text>
                            <Text style={styles.consentTitle}>Quick Ad</Text>
                            <Text style={styles.consentBody}>
                                {consentModal?.type === 'yesterday'
                                    ? "A short ad will play, then you'll see yesterday's solution."
                                    : `A short ad will play, then you can start ${levelDisplayName[level]}.`}
                            </Text>
                            <Text style={styles.consentCountdown}>{consentCountdown}</Text>
                            <TouchableOpacity style={styles.consentCancel} onPress={cancelConsent}>
                                <Text style={styles.consentCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
                
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
    consentOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    consentCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 32,
        paddingHorizontal: 28,
        alignItems: 'center',
        width: '78%',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    consentEmoji: {
        fontSize: 36,
        marginBottom: 10,
    },
    consentTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#333',
        marginBottom: 10,
    },
    consentBody: {
        fontSize: 15,
        color: '#555',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    consentCountdown: {
        fontSize: 48,
        fontWeight: '900',
        color: '#333',
        marginBottom: 20,
    },
    consentCancel: {
        paddingVertical: 10,
        paddingHorizontal: 32,
        borderRadius: 20,
        backgroundColor: '#eee',
    },
    consentCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
    },
});