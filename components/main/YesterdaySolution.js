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

    const solution = puzzle.shortestSolution;

    return (
        <ScrollView
            contentContainerStyle={[styles.container, { backgroundColor: levelColor }]}
            showsVerticalScrollIndicator={false}
        >
            <Text style={styles.heading}>Yesterday's {displayName} Solution</Text>
            <Text style={styles.subheading}>
                {puzzle.startingWord.toUpperCase()} → {puzzle.endingWord.toUpperCase()}
            </Text>
            <Text style={styles.stepsLabel}>
                Shortest solution: {solution.length - 1} {solution.length - 1 === 1 ? 'step' : 'steps'}
            </Text>

            <View style={styles.ladderContainer}>
                {solution.map((word, index) => (
                    <View key={index} style={styles.wordRow}>
                        <LadderStepWord
                            word={word.toUpperCase()}
                            level={index === 0 || index === solution.length - 1 ? null : level}
                            size={52}
                            fontSize={22}
                        />
                        {index < solution.length - 1 && (
                            <Text style={styles.arrow}>↓</Text>
                        )}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 20,
        flexGrow: 1,
    },
    heading: {
        fontSize: 22,
        fontWeight: '800',
        color: '#5B5A53',
        textAlign: 'center',
        marginBottom: 8,
    },
    subheading: {
        fontSize: 16,
        fontWeight: '700',
        color: '#5B5A53',
        marginBottom: 4,
        letterSpacing: 1,
    },
    stepsLabel: {
        fontSize: 13,
        color: '#777',
        marginBottom: 24,
    },
    ladderContainer: {
        alignItems: 'center',
        width: '100%',
    },
    wordRow: {
        alignItems: 'center',
    },
    arrow: {
        fontSize: 20,
        color: '#5B5A53',
        marginVertical: 2,
    },
    errorText: {
        fontSize: 15,
        color: '#5B5A53',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});
