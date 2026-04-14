import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import config from '../../config';
import { levelColorScheme } from '../../redux/constants/colorScheme';
import LadderStepWord from '../shared/LadderStepWord';

const levelDisplayName = { One: 'Classic', Two: 'Shuffle', Three: 'Morph' };

export default function YesterdaySolution({ route }) {
    const { level } = route.params;
    const currentUser = useSelector((state) => state.userState.currentUser);
    const [puzzle, setPuzzle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const levelColor = levelColorScheme[level] ?? '#9ADBFA';
    const displayName = levelDisplayName[level] || level;

    useEffect(() => {
        const fetchPrevious = async () => {
            try {
                const token = await getAuth().currentUser.getIdToken();
                const res = await axios.get(
                    `${config.WORD_LADDER_BACKEND}/api/getPreviousPuzzles`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const levelKey = level.toLowerCase();
                const p = res.data[levelKey];
                if (!p) {
                    setError("No previous puzzle found for this level.");
                } else {
                    setPuzzle(p);
                }
            } catch (e) {
                setError("Couldn't load yesterday's puzzle. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchPrevious();
    }, []);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: levelColor }]}>
                <ActivityIndicator size="large" color="#5B5A53" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.center, { backgroundColor: levelColor }]}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    const rawSolution = puzzle.shortestSolution;
    // Ensure the full path always includes the starting and ending word
    const solution = (() => {
        let s = [...rawSolution];
        if (s[0]?.toLowerCase() !== puzzle.startingWord?.toLowerCase()) {
            s = [puzzle.startingWord, ...s];
        }
        if (s[s.length - 1]?.toLowerCase() !== puzzle.endingWord?.toLowerCase()) {
            s = [...s, puzzle.endingWord];
        }
        return s;
    })();
    const stepCount = solution.length - 1;

    return (
        <View style={[styles.root, { backgroundColor: levelColor }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {puzzle.startingWord.toUpperCase()} → {puzzle.endingWord.toUpperCase()}
                </Text>
                <Text style={styles.stepsLabel}>
                    Shortest solution: {stepCount} {stepCount === 1 ? 'step' : 'steps'}
                </Text>
            </View>

            <View style={styles.solutionSection}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Solution</Text>
                    <View style={styles.divider} />
                    <ScrollView
                        contentContainerStyle={{ alignItems: 'center', paddingVertical: 8 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {solution.map((word, index) => (
                            <LadderStepWord
                                key={index}
                                word={word}
                                level={(index === 0 || index === solution.length - 1) ? null : level}
                                size={50}
                                fontSize={32}
                            />
                        ))}
                    </ScrollView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    stepsLabel: {
        fontSize: 13,
        color: '#666',
        fontWeight: '500',
    },
    solutionSection: {
        maxHeight: '70%',
        marginBottom: 20,
        flexShrink: 1,
    },
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
        marginBottom: 4,
    },
    errorText: {
        fontSize: 15,
        color: '#5B5A53',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});
