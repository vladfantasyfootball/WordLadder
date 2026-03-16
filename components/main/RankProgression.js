import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import * as Animatable from 'react-native-animatable';
import { levelColorScheme } from '../../redux/constants/colorScheme';

const RANKS = [
    { label: 'Novice',     minScore: 0,     minStreak: 0,  color: '#FF8A65', emoji: '📖' },
    { label: 'Apprentice', minScore: 1000,  minStreak: 0,  color: '#66BB6A', emoji: '✏️' },
    { label: 'Wordsmith',  minScore: 3000,  minStreak: 5,  color: '#42A5F5', emoji: '🖊️' },
    { label: 'Expert',     minScore: 10000, minStreak: 10, color: '#AB47BC', emoji: '🧠' },
    { label: 'Master',     minScore: 20000, minStreak: 15, color: '#FFA726', emoji: '⚡' },
    { label: 'Legend',     minScore: 50000, minStreak: 30, color: '#EF5350', emoji: '👑' },
];

function getCurrentRankIndex(totalScore, longestStreak) {
    let idx = 0;
    for (let i = 0; i < RANKS.length; i++) {
        if (totalScore >= RANKS[i].minScore && longestStreak >= RANKS[i].minStreak) idx = i;
    }
    return idx;
}

export default function RankProgression({ route }) {
    const { level } = route.params;
    const currentUser = useSelector((state) => state.userState.currentUser);
    const levelData = currentUser?.wordLadder?.[level.toLowerCase()];
    const totalScore = levelData?.totalScore ?? 0;
    const longestStreak = levelData?.longestStreak ?? 0;
    const bgColor = levelColorScheme[level.charAt(0).toUpperCase() + level.slice(1)];
    const currentRankIdx = getCurrentRankIndex(totalScore, longestStreak);

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}>
            {RANKS.map((rank, index) => {
                const isAchieved = index <= currentRankIdx;
                const isCurrent = index === currentRankIdx;
                const isNext = index === currentRankIdx + 1;

                const requirementParts = [];
                if (rank.minScore > 0) requirementParts.push(`${rank.minScore.toLocaleString()} pts`);
                if (rank.minStreak > 0) requirementParts.push(`${rank.minStreak}-day longest streak`);
                const requirement = requirementParts.length > 0
                    ? requirementParts.join(' + ')
                    : 'Starting rank';

                // Progress towards next rank
                let progressText = null;
                if (isNext) {
                    const parts = [];
                    if (rank.minScore > 0 && totalScore < rank.minScore) {
                        parts.push(`${(rank.minScore - totalScore).toLocaleString()} more pts needed`);
                    }
                    if (rank.minStreak > 0 && longestStreak < rank.minStreak) {
                        parts.push(`longest streak ${longestStreak}/${rank.minStreak} days`);
                    }
                    if (parts.length > 0) progressText = parts.join(' · ');
                }

                return (
                    <Animatable.View
                        key={rank.label}
                        animation={isCurrent ? 'pulse' : 'fadeInUp'}
                        iterationCount={isCurrent ? 'infinite' : 1}
                        duration={isCurrent ? 3000 : 400}
                        delay={isCurrent ? 0 : index * 80}
                        style={[
                            styles.row,
                            isCurrent && {
                                borderColor: '#FFD700',
                                borderWidth: 2.5,
                            },
                            !isAchieved && !isCurrent && styles.rowLocked,
                        ]}
                    >
                        {/* Left: connector line + dot */}
                        <View style={styles.timelineCol}>
                            {index !== 0 && (
                                <View style={[styles.lineTop, { backgroundColor: index <= currentRankIdx ? rank.color : '#ddd' }]} />
                            )}
                            <View style={[
                                styles.dot,
                                { backgroundColor: isAchieved ? rank.color : '#ddd' },
                                isCurrent && { width: 18, height: 18, borderRadius: 9 },
                            ]} />
                            {index !== RANKS.length - 1 && (
                                <View style={[styles.lineBottom, { backgroundColor: isAchieved && index < currentRankIdx ? rank.color : '#ddd' }]} />
                            )}
                        </View>

                        {/* Right: content */}
                        <View style={styles.content}>
                            <View style={styles.headerRow}>
                                <Text style={[styles.emoji, !isAchieved && styles.dim, isCurrent && styles.emojiCurrent]}>{rank.emoji}</Text>
                                <Text style={[styles.rankLabel, { color: isAchieved ? rank.color : '#bbb' }, isCurrent && styles.rankLabelCurrent]}>
                                    {rank.label}
                                </Text>
                                {isCurrent && (
                                    <View style={styles.currentBadge}>
                                        <Text style={styles.currentBadgeText}>YOUR RANK</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.requirement, !isAchieved && styles.dim]}>{requirement}</Text>
                            {progressText && (
                                <Text style={styles.progressText}>{progressText}</Text>
                            )}
                        </View>
                    </Animatable.View>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 24,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#555',
        marginBottom: 24,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 16,
        marginBottom: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    rowLocked: {
        backgroundColor: '#f5f5f5',
        shadowOpacity: 0,
        elevation: 0,
    },
    timelineCol: {
        width: 28,
        alignItems: 'center',
        marginRight: 14,
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    lineTop: {
        width: 2,
        flex: 1,
        marginBottom: 4,
    },
    lineBottom: {
        width: 2,
        flex: 1,
        marginTop: 4,
    },
    content: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    emoji: {
        fontSize: 22,
    },
    emojiCurrent: {
        fontSize: 30,
    },
    dim: {
        opacity: 0.35,
    },
    rankLabel: {
        fontSize: 17,
        fontWeight: '800',
        flex: 1,
    },
    rankLabelCurrent: {
        fontSize: 20,
        letterSpacing: 0.3,
    },
    requirement: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    progressText: {
        fontSize: 12,
        color: '#F57C00',
        fontWeight: '600',
        marginTop: 6,
    },
    currentBadge: {
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 10,
        backgroundColor: '#FFD700',
    },
    currentBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#1C1C1E',
        letterSpacing: 1.5,
    },
});
