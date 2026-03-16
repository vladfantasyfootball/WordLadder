import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getAuth } from 'firebase/auth';
import { fetchLeaderboard } from '../../redux/actions';
import { levelColorScheme } from '../../redux/constants/colorScheme';
import * as Animatable from 'react-native-animatable';

function formatValue(category, val) {
    if (val == null) return '—';
    if (category === 'averageScore') return val.toFixed ? val.toFixed(1) : String(val);
    if (category === 'currentStreak' || category === 'longestStreak') return `${val} days`;
    return Number(val).toLocaleString();
}

export default function LeaderboardDetail({ route }) {
    const { level, category } = route.params;
    const dispatch = useDispatch();
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;

    const leaderboardData = useSelector(
        (state) => state.leaderboardState?.[level]?.[category]
    );

    useEffect(() => {
        dispatch(fetchLeaderboard(level, category, auth));
    }, [level, category]);

    const bgColor = levelColorScheme[level.charAt(0).toUpperCase() + level.slice(1)];

    if (!leaderboardData) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
                <ActivityIndicator size="large" color="#555" />
            </View>
        );
    }

    const { top10: top5, total, userRank, percentileAhead, userScore } = leaderboardData;
    const userInTop5 = top5.some(e => e.userId === currentUserId);

    const CATEGORY_HEADINGS = {
        totalScore:    'Your Score',
        averageScore:  'Your Average Score',
        currentStreak: 'Your Current Streak',
        longestStreak: 'Your Best Streak',
        totalSolved:   "Puzzles You've Completed",
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}>

            {/* Score + percentile card */}
            {percentileAhead !== null ? (
                <Animatable.View animation="bounceIn" duration={700} delay={100} style={styles.percentileCard}>
                    <Text style={styles.scoreHeading}>{CATEGORY_HEADINGS[category]}</Text>
                    <Text style={styles.scoreDisplay}>{formatValue(category, userScore)}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.percentileLine}>
                        Better than{' '}
                        <Text style={styles.percentileHighlight}>{percentileAhead}%</Text>
                        {' '}of all players
                    </Text>
                </Animatable.View>
            ) : (
                <Animatable.View animation="fadeIn" duration={500} style={styles.percentileCard}>
                    <Text style={styles.noDataText}>
                        {category === 'averageScore'
                            ? 'Complete 7 puzzles to appear here'
                            : 'Complete a puzzle to appear here'}
                    </Text>
                </Animatable.View>
            )}

            {/* Top 5 list */}
            <View style={styles.listContainer}>
                <Text style={styles.listTitle}>Top 5</Text>
                {top5.length === 0 && (
                    <Text style={styles.emptyText}>No entries yet — be the first!</Text>
                )}
                {top5.map((entry, index) => {
                    const isUser = entry.userId === currentUserId;
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;
                    const isLast = index === top5.length - 1;
                    return (
                        <Animatable.View
                            key={entry.userId}
                            animation="fadeInUp"
                            duration={400}
                            delay={index * 60}
                        >
                            <View style={[styles.row, isUser && styles.rowHighlighted]}>
                                <Text style={styles.rankNumber}>{index + 1}</Text>
                                <Text style={[styles.scoreText, isUser && styles.scoreHighlighted]}>
                                    {formatValue(category, entry[category])}
                                </Text>
                                {isUser && (
                                    <View style={styles.youBadge}>
                                        <Text style={styles.youBadgeText}>YOU</Text>
                                    </View>
                                )}
                                {medal && !isUser && (
                                    <Text style={styles.medalText}>{medal}</Text>
                                )}
                                {medal && isUser && (
                                    <Text style={[styles.medalText, { marginLeft: 6 }]}>{medal}</Text>
                                )}
                            </View>
                            {!isLast && <View style={styles.rowDivider} />}
                        </Animatable.View>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    percentileCard: {
        backgroundColor: '#3A3A3C',
        borderRadius: 24,
        paddingVertical: 28,
        paddingHorizontal: 36,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
        width: '100%',
    },
    scoreHeading: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E0E0E0',
        marginBottom: 8,
        textAlign: 'center',
    },
    scoreDisplay: {
        fontSize: 52,
        fontWeight: '900',
        color: '#FFD60A',
        marginBottom: 16,
    },
    divider: {
        width: 48,
        height: 1.5,
        backgroundColor: '#3A3A3C',
        marginBottom: 16,
    },
    percentileLine: {
        fontSize: 16,
        color: '#E0E0E0',
        textAlign: 'center',
        fontWeight: '600',
    },
    percentileHighlight: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFD60A',
    },
    noDataText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    listContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 16,
    },
    listTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    rowDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: 4,
    },
    rowHighlighted: {
        backgroundColor: '#FFF9E6',
        borderWidth: 1.5,
        borderColor: '#FFD700',
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#999',
        width: 28,
        textAlign: 'center',
    },
    medalText: {
        fontSize: 22,
        marginLeft: 8,
    },
    scoreText: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginLeft: 8,
    },
    scoreHighlighted: {
        color: '#B8860B',
    },
    youBadge: {
        backgroundColor: '#FFD700',
        borderRadius: 8,
        paddingVertical: 3,
        paddingHorizontal: 8,
    },
    youBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#7A5C00',
    },
    emptyText: {
        textAlign: 'center',
        color: '#aaa',
        fontSize: 14,
        paddingVertical: 16,
    },
});
