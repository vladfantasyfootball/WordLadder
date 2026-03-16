import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native'
import { levelColorScheme } from '../../redux/constants/colorScheme';
import { useSelector } from 'react-redux';
import * as Animatable from 'react-native-animatable';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const RANKS = [
    { label: 'Novice',     minScore: 0,     minStreak: 0,  color: '#FF8A65', emoji: '📖' },
    { label: 'Apprentice', minScore: 1000,  minStreak: 0,  color: '#66BB6A', emoji: '✏️' },
    { label: 'Wordsmith',  minScore: 3000,  minStreak: 5,  color: '#42A5F5', emoji: '🖊️' },
    { label: 'Expert',     minScore: 10000, minStreak: 10, color: '#AB47BC', emoji: '🧠' },
    { label: 'Master',     minScore: 20000, minStreak: 15, color: '#FFA726', emoji: '⚡' },
    { label: 'Legend',     minScore: 50000, minStreak: 30, color: '#EF5350', emoji: '👑' },
];

function getRank(totalScore, longestStreak) {
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (totalScore >= r.minScore && longestStreak >= r.minStreak) rank = r;
    }
    return rank;
}

function getNextRank(totalScore, longestStreak) {
    const currentRank = getRank(totalScore, longestStreak);
    const currentIndex = RANKS.indexOf(currentRank);
    if (currentIndex === RANKS.length - 1) return null;
    const next = RANKS[currentIndex + 1];
    const needsScore = Math.max(0, next.minScore - totalScore);
    const needsStreak = Math.max(0, next.minStreak - longestStreak);
    return { ...next, needsScore, needsStreak };
}

function AnimatedNumber({ value, style, trigger }) {
    const [displayed, setDisplayed] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        setDisplayed(0);
        const duration = 2000;
        const start = Date.now();
        const to = value;

        const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayed(Math.round(to * eased));
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick);
            }
        };
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [value, trigger]);

    return <Text style={style}>{displayed}</Text>;
}

function StatCard({ icon, label, value, delay, accentColor, trigger, suffix, onPress, locked, lockMessage }) {
    const inner = (
        <>
            <Text style={styles.cardIcon}>{icon}</Text>
            <Text style={styles.cardLabel}>{label}</Text>
            {locked ? (
                <Text style={[styles.cardValue, { color: '#bbb', fontSize: 28 }]}>—</Text>
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                    <AnimatedNumber value={value} trigger={trigger} style={[styles.cardValue, { color: accentColor }]} />
                    {suffix && <Text style={[styles.cardValue, { color: accentColor, fontSize: 24, paddingBottom: 3 }]}>{suffix}</Text>}
                </View>
            )}
            {locked && lockMessage && (
                <Text style={styles.lockMessage}>{lockMessage}</Text>
            )}
            {!locked && onPress && (
                <Text style={styles.rankingsHint}>View Rankings</Text>
            )}
        </>
    );
    return (
        <Animatable.View animation="fadeInUp" duration={600} delay={delay} style={styles.card}>
            {!locked && onPress ? (
                <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={{ alignItems: 'center', width: '100%' }}>
                    {inner}
                </TouchableOpacity>
            ) : inner}
        </Animatable.View>
    );
}

export default function LevelStat({ navigation, level }) {
    const currentUser = useSelector((state) => state.userState.currentUser);
    const levelData = currentUser?.wordLadder[level.toLowerCase()];
    const isFocused = useIsFocused();
    const [animKey, setAnimKey] = useState(0);

    useEffect(() => {
        if (isFocused) {
            setAnimKey(k => k + 1);
        }
    }, [isFocused]);

    const isPremium = currentUser?.purchases?.premium === true;
    const bgColor = levelColorScheme[level];

    if (level.toLowerCase() === 'three' && !isPremium) {
        return (
            <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}>
                <Animatable.View animation="fadeInUp" duration={600} style={styles.premiumGate}>
                    <Ionicons name="lock-closed" size={48} color="#AF52DE" style={{ marginBottom: 16 }} />
                    <Text style={styles.premiumGateTitle}>Level 3 is Premium</Text>
                    <Text style={styles.premiumGateSubtitle}>
                        {'Unlock Level 3 to see your stats here. Level 3 introduces add & remove a letter moves.'}
                    </Text>
                    <TouchableOpacity
                        style={styles.premiumGateBtn}
                        onPress={() => navigation.navigate('Paywall')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.premiumGateBtnText}>Unlock Premium</Text>
                    </TouchableOpacity>
                </Animatable.View>
            </ScrollView>
        );
    }

    const currentStreak = levelData?.currentStreak ?? 0;
    const longestStreak = levelData?.longestStreak ?? 0;
    const totalScore = levelData?.totalScore ?? 0;
    const highScore = levelData?.highScore ?? 0;
    const totalAttempted = levelData?.totalAttempted ?? 0;
    const totalSolved = levelData?.totalSolved ?? 0;
    const winRate = totalAttempted > 0 ? Math.round((totalSolved / totalAttempted) * 100) : 0;
    const avgScore = totalSolved >= 7 ? Math.round(totalScore / totalSolved) : null;

    // Color scale: 0-30% = icy blue, 30-60% = yellow, 60-100% = green (accelerated)
    const getWinRateColor = (pct) => {
        if (pct <= 30) {
            return `rgb(100,181,246)`;
        } else if (pct <= 60) {
            // Icy blue (#64B5F6) → Yellow (#FFC107)
            const t = (pct - 30) / 30;
            const r = Math.round(100 + (255 - 100) * t);
            const g = Math.round(181 + (193 - 181) * t);
            const b = Math.round(246 + (7 - 246) * t);
            return `rgb(${r},${g},${b})`;
        } else {
            // Yellow (#FFC107) → Green (#1B8C2E) — exponential so 70% looks mostly green
            const t = Math.pow((pct - 60) / 40, 0.4);
            const r = Math.round(255 + (27 - 255) * t);
            const g = Math.round(193 + (140 - 193) * t);
            const b = Math.round(7 + (46 - 7) * t);
            return `rgb(${r},${g},${b})`;
        }
    };
    const winRateColor = getWinRateColor(winRate);

    const rank = getRank(totalScore, longestStreak);
    const nextRank = getNextRank(totalScore, longestStreak);

    const streakIcon = currentStreak >= 3 ? '🔥' : currentStreak > 0 ? '✨' : '❄️';

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}>

            {/* Rank Badge */}
            <Animatable.View key={animKey} animation="bounceIn" duration={800} delay={100}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('RankProgression', { level })}
                    activeOpacity={0.8}
                    style={[styles.rankBadge, { borderColor: rank.color }]}
                >
                    <Text style={styles.rankEmoji}>{rank.emoji}</Text>
                    <Text style={[styles.rankLabel, { color: rank.color }]}>{rank.label}</Text>
                    <Text style={styles.rankTap}>Tap to see progression</Text>
                </TouchableOpacity>
            </Animatable.View>

            {/* Top row: Avg Score | Total Score */}
            <View style={styles.row}>
                {avgScore !== null ? (
                    <StatCard
                        icon="📈"
                        label="Avg Score"
                        value={avgScore}
                        delay={150}
                        accentColor="#F57C00"
                        trigger={animKey}
                        onPress={() => navigation.navigate('LeaderboardDetail', { level: level.toLowerCase(), category: 'averageScore' })}
                    />
                ) : (
                    <StatCard
                        icon="📈"
                        label="Avg Score"
                        value={0}
                        delay={150}
                        accentColor="#F57C00"
                        trigger={animKey}
                        locked
                        lockMessage={`${totalSolved}/7 to unlock`}
                    />
                )}
                <StatCard
                    icon="📊"
                    label="Total Score"
                    value={totalScore}
                    delay={250}
                    accentColor="#2E7D32"
                    trigger={animKey}
                    onPress={() => navigation.navigate('LeaderboardDetail', { level: level.toLowerCase(), category: 'totalScore' })}
                />
            </View>

            {/* Middle row: Current Streak | Longest Streak */}
            <View style={styles.row}>
                <StatCard
                    icon={streakIcon}
                    label="Current Streak"
                    value={currentStreak}
                    delay={350}
                    accentColor="#E65100"
                    trigger={animKey}
                    onPress={() => navigation.navigate('LeaderboardDetail', { level: level.toLowerCase(), category: 'currentStreak' })}
                />
                <StatCard
                    icon="🏅"
                    label="Longest Streak"
                    value={longestStreak}
                    delay={450}
                    accentColor="#1565C0"
                    trigger={animKey}
                    onPress={() => navigation.navigate('LeaderboardDetail', { level: level.toLowerCase(), category: 'longestStreak' })}
                />
            </View>

            {/* Bottom: Puzzles Solved centered */}
            <View style={[styles.row, { justifyContent: 'center' }]}>
                <StatCard
                    icon="🗓️"
                    label="Puzzles Solved"
                    value={totalSolved}
                    delay={550}
                    accentColor="#00695C"
                    trigger={animKey}
                    onPress={() => navigation.navigate('LeaderboardDetail', { level: level.toLowerCase(), category: 'totalSolved' })}
                />
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    rankBadge: {
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        borderWidth: 3,
        paddingVertical: 10,
        paddingHorizontal: 28,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        minWidth: 200,
    },
    rankEmoji: {
        fontSize: 32,
        marginBottom: 2,
    },
    rankLabel: {
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    rankNext: {
        fontSize: 11,
        color: '#888',
        marginTop: 3,
    },
    rankTap: {
        fontSize: 11,
        color: '#aaa',
        marginTop: 5,
        textDecorationLine: 'underline',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    premiumGate: {
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 36,
        paddingHorizontal: 28,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
    },
    premiumGateTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111',
        marginBottom: 10,
        textAlign: 'center',
    },
    premiumGateSubtitle: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 24,
    },
    premiumGateBtn: {
        backgroundColor: '#AF52DE',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 32,
    },
    premiumGateBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
        width: 140,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
        elevation: 4,
    },
    cardIcon: {
        fontSize: 28,
        marginBottom: 4,
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#777',
        textAlign: 'center',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    rankingsHint: {
        fontSize: 12,
        color: '#555',
        marginTop: 6,
        fontWeight: '700',
        letterSpacing: 0.3,
        textDecorationLine: 'underline',
    },
    lockMessage: {
        fontSize: 10,
        color: '#bbb',
        marginTop: 4,
        textAlign: 'center',
    },
});