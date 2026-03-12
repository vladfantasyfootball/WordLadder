import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, Linking, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
};

export default function LevelCompleteScreen({ completeLadder, level, shortestSolution, timeStarted, timeFinished, prevStats, navigation }) {
    const currentUser = useSelector((state) => state.userState.currentUser);
    const dispatch = useDispatch();
    const isPremium = currentUser?.purchases?.premium === true;

    // ─── Computed Values ─────────────────────────────────────────────────────
    const startTime = timeStarted || currentUser.wordLadder[level.toLowerCase()].timeStarted;
    const endTime = timeFinished || currentUser.wordLadder[level.toLowerCase()].timeFinished;

    let timeTaken = 0;
    if (startTime && endTime && endTime > startTime) {
        timeTaken = Math.round((endTime - startTime) / 1000);
    }

    const timeFormattedTimeTaken = timeTaken <= 3600
        ? new Date(timeTaken * 1000).toISOString().substr(14, 5)
        : new Date(timeTaken * 1000).toISOString().substr(11, 8);

    let timeBonus = 100;
    if (timeTaken > 60) {
        timeBonus = Math.max(0, 100 - Math.floor((timeTaken - 60) / 30) * 5);
    }

    const completionBonus = completionBonusMap[level.toLowerCase()];
    const shortestLength = shortestSolution.length;
    const userLength = completeLadder.length;
    const wordBonus = Math.max(0, 100 - (userLength - shortestLength) * 5);
    const totalScore = completionBonus + wordBonus + timeBonus;

    const isFirstCompletion = prevStats != null;
    const newTotalScore = isFirstCompletion ? prevStats.totalScore + totalScore : null;
    const isNewHighScore = isFirstCompletion && totalScore > (prevStats.highScore ?? 0);
    const newStreak = isFirstCompletion ? prevStats.currentStreak + 1 : null;
    const streakIncreased = isFirstCompletion && newStreak > prevStats.currentStreak;
    const isOptimalPath = userLength === shortestLength;

    const levelColor = levelColorScheme[level] ?? '#9ADBFA';

    // ─── Achievements (first completion only) ────────────────────────────────
    const achievements = [];
    if (isFirstCompletion) {
        achievements.push({
            icon: 'checkmark-circle',
            color: '#34C759',
            title: 'Level Complete!',
            description: `Finished in ${timeFormattedTimeTaken}`,
        });
        if (isNewHighScore) achievements.push({
            icon: 'trophy',
            color: '#FFD700',
            title: 'New High Score!',
            description: `You scored ${totalScore} points!`,
        });
        if (streakIncreased) achievements.push({
            icon: 'flame',
            color: '#FF6B35',
            title: 'Streak Extended!',
            description: `${prevStats.currentStreak} → ${newStreak} days`,
        });
        if (isOptimalPath) achievements.push({
            icon: 'star',
            color: '#AF52DE',
            title: 'Optimal Path!',
            description: 'You found the shortest solution!',
        });
        achievements.push({
            icon: 'stats-chart',
            color: '#007AFF',
            title: 'Total Score',
            description: `${prevStats.totalScore} → ${newTotalScore}  (+${totalScore})`,
        });
    }

    // ─── Overlay Animation ────────────────────────────────────────────────────
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [overlayVisible, setOverlayVisible] = useState(isFirstCompletion);
    const overlayAnim = useRef(new Animated.Value(isFirstCompletion ? 1 : 0)).current;
    const cardScale = useRef(new Animated.Value(0.85)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!overlayVisible) return;

        if (carouselIndex < achievements.length) {
            // Animate card in
            cardScale.setValue(0.85);
            cardOpacity.setValue(0);
            Animated.parallel([
                Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
                Animated.timing(cardOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]).start();

            // Hold, then fade card out and advance
            const hold = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(cardScale, { toValue: 0.9, duration: 200, useNativeDriver: true }),
                    Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                ]).start(() => setCarouselIndex(i => i + 1));
            }, 1700);

            return () => clearTimeout(hold);
        } else {
            // All cards shown — fade out overlay
            Animated.timing(overlayAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
                setOverlayVisible(false);
            });
        }
    }, [carouselIndex, overlayVisible]);

    // ─── Solution Tab ─────────────────────────────────────────────────────────
    const [showShortest, setShowShortest] = useState(false);
    const displayLadder = (showShortest && isPremium) ? shortestSolution : completeLadder;

    // ─── Notification Prompt ──────────────────────────────────────────────────
    useEffect(() => {
        const hasBeenAsked = currentUser?.notifications?.hasBeenAskedForNotifications;
        const notificationsEnabled = currentUser?.notifications?.enabled;
        if (!hasBeenAsked && !notificationsEnabled) {
            setTimeout(showNotificationPrompt, isFirstCompletion ? 4500 : 500);
        }
    }, []);

    const markAsAsked = async () => {
        try {
            const auth = getAuth();
            const updatedUser = {
                ...currentUser,
                notifications: { ...currentUser.notifications, hasBeenAskedForNotifications: true },
            };
            await dispatch(updateUser(currentUser.id, updatedUser, auth));
        } catch (error) {
            console.error('Error marking notification prompt as shown:', error);
        }
    };

    const showNotificationPrompt = () => {
        Alert.alert(
            '🎉 Great Job!',
            'Would you like to receive daily notifications when new puzzles are available?',
            [
                { text: 'Not Now', style: 'cancel', onPress: markAsAsked },
                { text: 'Yes, Notify Me!', onPress: enableNotifications },
            ]
        );
    };

    const enableNotifications = async () => {
        try {
            const hasPermission = await checkNotificationPermissions();
            const token = await registerForPushNotificationsAsync();
            if (token) {
                const auth = getAuth();
                const updatedUser = {
                    ...currentUser,
                    notifications: { enabled: true, expoPushToken: token, hasBeenAskedForNotifications: true },
                };
                await dispatch(updateUser(currentUser.id, updatedUser, auth));
                Alert.alert('✅ Notifications Enabled', "You'll receive a daily reminder if you haven't played today's puzzle!");
            } else {
                Alert.alert(
                    'Notifications Blocked',
                    hasPermission
                        ? 'Failed to register for notifications. Please try again from the Profile page.'
                        : 'Please enable notifications in Settings to receive daily puzzle reminders.',
                    [
                        { text: 'Cancel', style: 'cancel', onPress: markAsAsked },
                        { text: 'Open Settings', onPress: async () => { await Linking.openSettings(); await markAsAsked(); } },
                    ]
                );
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
            Alert.alert('Error', 'Failed to enable notifications. You can try again from the Profile page.');
            await markAsAsked();
        }
    };

    const handleShare = async () => {
        try {
            const startWord = completeLadder[0];
            const endWord = completeLadder[completeLadder.length - 1];
            const optimalLine = isOptimalPath ? '\n⭐ Found the shortest solution!' : '';
            const message = `🎉 I just completed a Level ${level} Word Ladder!\n\n${startWord.toUpperCase()} → ${endWord.toUpperCase()}\n⏱️ Time: ${timeFormattedTimeTaken}\n📊 Score: ${totalScore}\n🪜 ${userLength} words${optimalLine}\n\nCan you beat my score?\nhttps://testflight.apple.com/join/JxNSA5rZ`;
            await Share.share({ message });
        } catch {
            Alert.alert('Error', 'Unable to share. Please try again.');
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <View style={[styles.root, { backgroundColor: levelColor }]}>

            {/* ── Celebration Overlay ── */}
            <Modal
                visible={overlayVisible}
                transparent
                animationType="none"
                statusBarTranslucent
            >
                <Animated.View style={[styles.overlay, { opacity: overlayAnim, backgroundColor: levelColor + 'AA' }]}>
                    {carouselIndex < achievements.length && (
                        <Animated.View style={[styles.achievementCard, {
                            opacity: cardOpacity,
                            transform: [{ scale: cardScale }],
                        }]}>
                            <Ionicons
                                name={achievements[carouselIndex].icon}
                                size={68}
                                color={achievements[carouselIndex].color}
                                style={styles.achievementIcon}
                            />
                            <Text style={[styles.achievementTitle, { color: achievements[carouselIndex].color }]}>
                                {achievements[carouselIndex].title}
                            </Text>
                            <Text style={styles.achievementDesc}>
                                {achievements[carouselIndex].description}
                            </Text>
                            <View style={styles.dotsRow}>
                                {achievements.map((_, i) => (
                                    <View key={i} style={[styles.dot, i === carouselIndex && styles.dotActive]} />
                                ))}
                            </View>
                        </Animated.View>
                    )}
                </Animated.View>
            </Modal>

            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Level Complete</Text>
            </View>

            {/* ── Score Card ── */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Score Breakdown</Text>
                <View style={styles.divider} />
                <Animatable.View animation="fadeInRight" delay={400} style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Completion Bonus</Text>
                    <Text style={styles.scoreValue}>+{completionBonus}</Text>
                </Animatable.View>
                <Animatable.View animation="fadeInRight" delay={800} style={styles.scoreRow}>
                    <Text style={styles.scoreLabel}>Word Bonus</Text>
                    <Text style={styles.scoreValue}>+{wordBonus}</Text>
                </Animatable.View>
                <Animatable.View animation="fadeInRight" delay={1200} style={styles.scoreRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.scoreLabel}>Time Bonus</Text>
                        <Text style={styles.scoreSubLabel}>  {timeFormattedTimeTaken}</Text>
                    </View>
                    <Text style={styles.scoreValue}>+{timeBonus}</Text>
                </Animatable.View>
                <View style={styles.divider} />
                <Animatable.View animation="bounceIn" delay={1600} style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Round Score</Text>
                    <Text style={styles.totalValue}>{totalScore}</Text>
                </Animatable.View>
            </View>

            {/* ── Solution Viewer (fills remaining space) ── */}
            <View style={styles.solutionSection}>
                <View style={[styles.card, { flex: 1 }]}>
                    {isOptimalPath ? (
                        <View style={styles.optimalBanner}>
                            <Ionicons name="star" size={16} color="#AF52DE" style={{ marginRight: 6 }} />
                            <Text style={styles.optimalBannerText}>Shortest possible solution!</Text>
                            <Ionicons name="star" size={16} color="#AF52DE" style={{ marginLeft: 6 }} />
                        </View>
                    ) : (
                        <View style={styles.tabBar}>
                            <TouchableOpacity
                                style={[styles.tab, !showShortest && styles.tabActive]}
                                onPress={() => setShowShortest(false)}
                            >
                                <Text style={[styles.tabText, !showShortest && styles.tabTextActive]}>Your Solution</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, showShortest && styles.tabActive]}
                                onPress={() => {
                                    if (isPremium) {
                                        setShowShortest(true);
                                    } else {
                                        navigation.navigate('Paywall');
                                    }
                                }}
                            >
                                {!isPremium && (
                                    <Ionicons name="lock-closed" size={13} color={showShortest ? '#111' : '#888'} style={{ marginRight: 4 }} />
                                )}
                                <Text style={[styles.tabText, showShortest && styles.tabTextActive]}>Shortest</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <ScrollView
                        contentContainerStyle={{ alignItems: 'center', paddingVertical: 8 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {displayLadder.map((word, index) => (
                            <LadderStepWord
                                key={index}
                                word={word}
                                level={(index === 0 || index === displayLadder.length - 1) ? null : level}
                                size={50}
                                fontSize={32}
                            />
                        ))}
                    </ScrollView>
                </View>
            </View>

            {/* ── Share Button (pinned to bottom) ── */}
            <Animatable.View animation="fadeInUp" delay={2200} style={styles.shareWrapper}>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
                    <Ionicons name="share-outline" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.shareBtnText}>Share with Friends</Text>
                </TouchableOpacity>
            </Animatable.View>

        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },

    // ── Overlay ──
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    achievementCard: {
        backgroundColor: '#fff',
        borderRadius: 28,
        paddingVertical: 44,
        paddingHorizontal: 40,
        alignItems: 'center',
        width: '82%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
    },
    achievementIcon: {
        marginBottom: 16,
    },
    achievementTitle: {
        fontSize: 30,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: 0.3,
        marginBottom: 8,
    },
    achievementDesc: {
        fontSize: 19,
        color: '#444',
        textAlign: 'center',
        fontWeight: '500',
        marginBottom: 24,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 7,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#DDD',
    },
    dotActive: {
        backgroundColor: '#555',
        width: 22,
        borderRadius: 4,
    },

    // ── Header ──
    header: {
        paddingTop: 20,
        paddingBottom: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    headerSub: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },

    // ── Score Card ──
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        marginHorizontal: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#888',
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    divider: {
        height: 1,
        backgroundColor: '#EBEBEB',
        marginHorizontal: 16,
        marginVertical: 2,
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    scoreLabel: {
        fontSize: 15,
        color: '#555',
        fontWeight: '500',
    },
    scoreSubLabel: {
        fontSize: 13,
        color: '#999',
        fontWeight: '400',
    },
    scoreValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#007AFF',
    },

    // ── Solution Section ──
    solutionSection: {
        flex: 1,
        marginTop: 14,
    },
    optimalBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3E8FF',
        marginHorizontal: 12,
        marginTop: 12,
        marginBottom: 6,
        paddingVertical: 8,
        borderRadius: 10,
    },
    optimalBannerText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#AF52DE',
        letterSpacing: 0.3,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        padding: 3,
        margin: 12,
        marginBottom: 6,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    tabActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
    },
    tabTextActive: {
        color: '#111',
    },

    // ── Share Button ──
    shareWrapper: {
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 16,
    },
    shareBtn: {
        backgroundColor: '#34C759',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
    },
    shareBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});