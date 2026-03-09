import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Text, ScrollView } from 'react-native'
import { levelColorScheme } from '../../redux/constants/colorScheme';
import { useSelector } from 'react-redux';
import * as Animatable from 'react-native-animatable';
import { useIsFocused } from '@react-navigation/native';

const RANKS = [
    { label: 'Novice',     minScore: 0,    minStreak: 0,  color: '#9E9E9E', emoji: '📖' },
    { label: 'Apprentice', minScore: 100,  minStreak: 0,  color: '#66BB6A', emoji: '✏️' },
    { label: 'Wordsmith',  minScore: 500,  minStreak: 0,  color: '#42A5F5', emoji: '🖊️' },
    { label: 'Expert',     minScore: 1500, minStreak: 0,  color: '#AB47BC', emoji: '🧠' },
    { label: 'Master',     minScore: 3000, minStreak: 7,  color: '#FFA726', emoji: '⚡' },
    { label: 'Legend',     minScore: 6000, minStreak: 30, color: '#EF5350', emoji: '👑' },
];

function getRank(totalScore, currentStreak) {
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (totalScore >= r.minScore && currentStreak >= r.minStreak) rank = r;
    }
    return rank;
}

function getNextRank(totalScore, currentStreak) {
    const currentRank = getRank(totalScore, currentStreak);
    const currentIndex = RANKS.indexOf(currentRank);
    if (currentIndex === RANKS.length - 1) return null;
    const next = RANKS[currentIndex + 1];
    const needsScore = Math.max(0, next.minScore - totalScore);
    const needsStreak = Math.max(0, next.minStreak - currentStreak);
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

function StatCard({ icon, label, value, delay, accentColor, trigger, suffix }) {
    return (
        <Animatable.View animation="fadeInUp" duration={600} delay={delay} style={styles.card}>
            <Text style={styles.cardIcon}>{icon}</Text>
            <Text style={styles.cardLabel}>{label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <AnimatedNumber value={value} trigger={trigger} style={[styles.cardValue, { color: accentColor }]} />
                {suffix && <Text style={[styles.cardValue, { color: accentColor, fontSize: 24, paddingBottom: 3 }]}>{suffix}</Text>}
            </View>
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

    const currentStreak = levelData?.currentStreak ?? 0;
    const longestStreak = levelData?.longestStreak ?? 0;
    const totalScore = levelData?.totalScore ?? 0;
    const highScore = levelData?.highScore ?? 0;
    const totalAttempted = levelData?.totalAttempted ?? 0;
    const totalSolved = levelData?.totalSolved ?? 0;
    const winRate = totalAttempted > 0 ? Math.round((totalSolved / totalAttempted) * 100) : 0;

    // Color scale: 0% = icy blue, 60% = yellow, 100% = green
    const getWinRateColor = (pct) => {
        if (pct <= 60) {
            // Icy blue (#64B5F6) → Yellow (#FFC107)
            const t = pct / 60;
            const r = Math.round(100 + (255 - 100) * t);
            const g = Math.round(181 + (193 - 181) * t);
            const b = Math.round(246 + (7 - 246) * t);
            return `rgb(${r},${g},${b})`;
        } else {
            // Yellow (#FFC107) → Green (#2E7D32)
            const t = (pct - 60) / 40;
            const r = Math.round(255 + (46 - 255) * t);
            const g = Math.round(193 + (125 - 193) * t);
            const b = Math.round(7 + (50 - 7) * t);
            return `rgb(${r},${g},${b})`;
        }
    };
    const winRateColor = getWinRateColor(winRate);

    const rank = getRank(totalScore, currentStreak);
    const nextRank = getNextRank(totalScore, currentStreak);

    const streakIcon = currentStreak >= 3 ? '🔥' : currentStreak > 0 ? '✨' : '❄️';
    const bgColor = levelColorScheme[level];

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}>

            {/* Rank Badge */}
            <Animatable.View key={animKey} animation="bounceIn" duration={800} delay={100} style={[styles.rankBadge, { borderColor: rank.color }]}>
                <Text style={styles.rankEmoji}>{rank.emoji}</Text>
                <Text style={[styles.rankLabel, { color: rank.color }]}>{rank.label}</Text>
                {nextRank && (
                    <Text style={styles.rankNext}>
                        {[
                            nextRank.needsScore > 0 ? `${nextRank.needsScore} pts` : null,
                            nextRank.needsStreak > 0 ? `${nextRank.needsStreak}-day streak` : null,
                        ].filter(Boolean).join(' + ') + ` to ${nextRank.label}`}
                    </Text>
                )}
            </Animatable.View>

            {/* Streak Cards */}
            <View style={styles.row}>
                <StatCard
                    icon={streakIcon}
                    label="Current Streak"
                    value={currentStreak}
                    delay={150}
                    accentColor="#E65100"
                    trigger={animKey}
                />
                <StatCard
                    icon="🏅"
                    label="Longest Streak"
                    value={longestStreak}
                    delay={250}
                    accentColor="#1565C0"
                    trigger={animKey}
                />
            </View>

            {/* Score Cards */}
            <View style={styles.row}>
                <StatCard
                    icon="📊"
                    label="Total Score"
                    value={totalScore}
                    delay={350}
                    accentColor="#2E7D32"
                    trigger={animKey}
                />
                <StatCard
                    icon="🏆"
                    label="High Score"
                    value={highScore}
                    delay={450}
                    accentColor="#6A1B9A"
                    trigger={animKey}
                />
            </View>

            {/* Win Rate */}
            <View style={styles.row}>
                <StatCard
                    icon="🎯"
                    label="Win Rate"
                    value={winRate}
                    delay={550}
                    accentColor={winRateColor}
                    trigger={animKey}
                    suffix="%"
                />
                <StatCard
                    icon="🗓️"
                    label="Puzzles Played"
                    value={totalAttempted}
                    delay={650}
                    accentColor="#00695C"
                    trigger={animKey}
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
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    rankBadge: {
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 20,
        borderWidth: 3,
        paddingVertical: 16,
        paddingHorizontal: 32,
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        minWidth: 200,
    },
    rankEmoji: {
        fontSize: 40,
        marginBottom: 4,
    },
    rankLabel: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    rankNext: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    row: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 14,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
        width: 150,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
        elevation: 4,
    },
    cardIcon: {
        fontSize: 32,
        marginBottom: 6,
    },
    cardLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#777',
        textAlign: 'center',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardValue: {
        fontSize: 36,
        fontWeight: 'bold',
    },
});