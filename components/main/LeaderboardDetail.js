import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { getAuth } from 'firebase/auth';
import { fetchLeaderboard, saveLeaderboardName } from '../../redux/actions';
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

    const currentUser = useSelector((state) => state.userState?.currentUser);
    const leaderboardData = useSelector(
        (state) => state.leaderboardState?.[level]?.[category]
    );

    const [nameInput, setNameInput] = useState('');
    const [nameError, setNameError] = useState('');
    const [nameSaving, setNameSaving] = useState(false);

    useEffect(() => {
        dispatch(fetchLeaderboard(level, category, auth));
    }, [level, category]);

    const handleSaveName = async () => {
        const trimmed = nameInput.trim();
        if (!/^[a-zA-Z ]{1,20}$/.test(trimmed)) {
            setNameError('1–20 characters, letters and spaces only.');
            return;
        }
        setNameError('');
        setNameSaving(true);
        try {
            await dispatch(saveLeaderboardName(trimmed, auth));
        } catch (e) {
            setNameError(e?.response?.data || 'Something went wrong. Please try again.');
        } finally {
            setNameSaving(false);
        }
    };

    const bgColor = levelColorScheme[level.charAt(0).toUpperCase() + level.slice(1)];

    if (!leaderboardData) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: bgColor }]}>
                <ActivityIndicator size="large" color="#555" />
            </View>
        );
    }

    const { top10: top5, total, userRank, percentileAhead, userScore, userDisplayName } = leaderboardData;
    const userInTop5 = top5.some(e => e.userId === currentUserId);

    const CATEGORY_HEADINGS = {
        totalScore:    'Your Score',
        averageScore:  'Your Average Score',
        currentStreak: 'Your Current Streak',
        longestStreak: 'Your Best Streak',
        totalSolved:   "Puzzles You've Completed",
    };

    // If no leaderboard name set, show inline name entry instead of leaderboard
    if (currentUser && !currentUser.leaderboardName) {
        return (
            <View style={[styles.nameEntryScreen, { backgroundColor: bgColor }]}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Choose your display name</Text>
                    <Text style={styles.modalSubtitle}>This is how you'll appear on the global leaderboard. Your scores and streak will be visible to all players. Letters and spaces only, max 20 characters.</Text>
                    <TextInput
                        style={styles.nameInput}
                        value={nameInput}
                        onChangeText={t => {
                                const filtered = t.replace(/[^a-zA-Z ]/g, '');
                                if (filtered !== t) {
                                    setNameError('Letters and spaces only.');
                                } else {
                                    setNameError('');
                                }
                                setNameInput(filtered);
                            }}
                        placeholder="e.g. Word Wizard"
                        placeholderTextColor="#999"
                        maxLength={20}
                        autoCapitalize="words"
                        autoCorrect={false}
                    />
                    {nameError ? <Text style={styles.nameError}>{nameError}</Text> : null}
                    <TouchableOpacity
                        style={[styles.saveButton, nameSaving && styles.saveButtonDisabled]}
                        onPress={handleSaveName}
                        disabled={nameSaving}
                    >
                        <Text style={styles.saveButtonText}>{nameSaving ? 'Saving…' : 'Save Name'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}>

            {/* Score + percentile card */}
            {percentileAhead !== null ? (
                <Animatable.View animation="bounceIn" duration={700} delay={100} style={styles.percentileCard}>
                    <Text style={styles.scoreHeading}>{CATEGORY_HEADINGS[category]}</Text>
                    <Text style={styles.scoreDisplay} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.4}>{formatValue(category, userScore)}</Text>
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
                                <View style={styles.nameScoreCol}>
                                    {(() => {
                                        const name = isUser ? (currentUser?.leaderboardName || null) : entry.displayName;
                                        return name ? (
                                            <Text style={[styles.displayName, isUser && styles.displayNameHighlighted]} numberOfLines={1}>{name}</Text>
                                        ) : null;
                                    })()}
                                    <Text style={[styles.scoreText, isUser && styles.scoreHighlighted]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                                        {formatValue(category, entry[category])}
                                    </Text>
                                </View>
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
                {!userInTop5 && userRank !== null && (
                    <>
                        <View style={styles.rowDivider} />
                        <View style={styles.ellipsisRow}>
                            <Text style={styles.ellipsisText}>• • •</Text>
                        </View>
                        <Animatable.View animation="fadeInUp" duration={400} delay={300}>
                            <View style={[styles.row, styles.rowHighlighted]}>
                                <Text style={styles.rankNumber}>{userRank}</Text>
                                <View style={styles.nameScoreCol}>
                                    {(userDisplayName || currentUser?.leaderboardName) ? (
                                        <Text style={[styles.displayName, styles.displayNameHighlighted]} numberOfLines={1}>
                                            {userDisplayName || currentUser?.leaderboardName}
                                        </Text>
                                    ) : null}
                                    <Text style={[styles.scoreText, styles.scoreHighlighted]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                                        {formatValue(category, userScore)}
                                    </Text>
                                </View>
                                <View style={styles.youBadge}>
                                    <Text style={styles.youBadgeText}>YOU</Text>
                                </View>
                            </View>
                        </Animatable.View>
                    </>
                )}
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
        backgroundColor: '#D0D0D0',
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
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginLeft: 0,
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
    ellipsisRow: {
        alignItems: 'center',
        paddingVertical: 6,
    },
    ellipsisText: {
        fontSize: 14,
        color: '#999',
        letterSpacing: 6,
    },
    nameScoreCol: {
        flex: 1,
        marginLeft: 8,
        justifyContent: 'center',
    },
    displayName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 1,
    },
    displayNameHighlighted: {
        color: '#B8860B',
    },
    nameEntryScreen: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    modalCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111',
        textAlign: 'center',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginBottom: 14,
        lineHeight: 18,
    },
    nameInput: {
        borderWidth: 1.5,
        borderColor: '#DDD',
        borderRadius: 12,
        paddingVertical: 9,
        paddingHorizontal: 14,
        fontSize: 16,
        color: '#111',
        marginBottom: 6,
    },
    nameError: {
        fontSize: 13,
        color: '#E53935',
        marginBottom: 12,
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: '#FFD60A',
        borderRadius: 14,
        paddingVertical: 11,
        alignItems: 'center',
        marginTop: 6,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#333',
    },
    skipButton: {
        marginTop: 14,
        alignItems: 'center',
    },
    skipText: {
        fontSize: 14,
        color: '#999',
    },
});
