import React, { useState, useEffect } from 'react';
import {
    Modal, View, Text, TouchableOpacity, StyleSheet,
    SafeAreaView, ScrollView, Platform, Alert,
} from 'react-native';
import { levelColorScheme, levelButtonColorScheme } from '../../redux/constants/colorScheme';

// ─── Tutorial step data ───────────────────────────────────────────────────────

const TUTORIALS = {
    One: [
        {
            type: 'goal',
            title: 'Your Goal',
            body: 'Transform the starting word into the target word, one step at a time.\nEvery word along the way must be a real English word.',
            startWord: 'TEAR',
            endWord: 'BEAK',
        },
        {
            type: 'transform',
            title: 'How to Move',
            body: 'Change exactly one letter to form a new valid word.',
            examples: [
                { from: 'TEAR', to: 'BEAR', note: 'T changed to B' },
                { from: 'BEAR', to: 'BEAK', note: 'R changed to K' },
            ],
        },
        {
            type: 'puzzle',
            title: "Let's See It",
            body: "Here's a quick example from start to finish:",
            chains: [
                { label: null, words: ['TEAR', 'BEAR', 'BEAK'] },
            ],
        },
        {
            type: 'scoring',
            title: "How You're Scored",
            items: [
                { emoji: '⚡', text: 'Fewer steps = higher score' },
                { emoji: '⏱', text: 'Faster time = higher score' },
                { emoji: '🏆', text: 'Compete on the leaderboard' },
            ],
        },
        { type: 'ready', title: 'Ready to Play?' },
    ],

    Two: [
        {
            type: 'transform',
            title: 'New Move: Anagram',
            body: 'Rearrange all the letters to spell a new valid word.',
            examples: [
                { from: 'BAKE', to: 'BEAK', note: 'Same letters, rearranged' },
            ],
        },
        {
            type: 'transform',
            title: 'Plus: Everything from Classic',
            body: 'You can still change a single letter too — both moves are always available.',
            examples: [
                { from: 'BAKE', to: 'RAKE', note: 'B → R  (change one letter)' },
                { from: 'BAKE', to: 'BEAK', note: 'Anagram  (new move)' },
            ],
        },
        {
            type: 'puzzle',
            title: 'Example Puzzle',
            body: 'Multiple paths can reach the same answer:',
            chains: [
                { label: 'One path', words: ['BAKE', 'BEAK', 'BEAR'] },
                { label: 'Another path', words: ['BAKE', 'BARE', 'BEAR'] },
            ],
        },
        {
            type: 'scoring',
            title: "How You're Scored",
            items: [
                { emoji: '⚡', text: 'Fewer steps = higher score' },
                { emoji: '⏱', text: 'Faster time = higher score' },
                { emoji: '🏆', text: 'Compete on the leaderboard' },
            ],
        },
        { type: 'ready', title: 'Ready to Play?' },
    ],

    Three: [
        {
            type: 'transform',
            title: 'New Move: Add or Remove a Letter',
            body: 'Insert or remove one letter anywhere in the word to form a new valid word.',
            examples: [
                { from: 'LIME', to: 'SLIME', note: 'Added S at the start' },
                { from: 'SLIME', to: 'SLIM', note: 'Removed E at the end' },
            ],
        },
        {
            type: 'transform',
            title: 'All Three Moves',
            body: 'You can use any combination of all moves in a single puzzle:',
            examples: [
                { from: 'BAKE', to: 'RAKE', note: 'Change one letter' },
                { from: 'BAKE', to: 'BEAK', note: 'Anagram' },
                { from: 'LIME', to: 'SLIME', note: 'Add a letter' },
            ],
        },
        {
            type: 'puzzle',
            title: 'Example Puzzle',
            body: 'Using the add move and then an anagram:',
            chains: [
                { label: null, words: ['LIME', 'SLIME', 'SMILE'] },
            ],
        },
        {
            type: 'scoring',
            title: "How You're Scored",
            items: [
                { emoji: '⚡', text: 'Fewer steps = higher score' },
                { emoji: '⏱', text: 'Faster time = higher score' },
                { emoji: '🏆', text: 'Compete on the leaderboard' },
            ],
        },
        { type: 'ready', title: 'Ready to Play?' },
    ],
};

// ─── Helper: detect changed letter indices ────────────────────────────────────

function getChangedIndices(from, to) {
    if (from.length !== to.length) return []; // add/remove: no per-letter highlight
    const sortedFrom = from.split('').sort().join('');
    const sortedTo = to.split('').sort().join('');
    if (sortedFrom === sortedTo) return []; // anagram: all letters present, none "wrong"
    return from.split('').reduce((acc, ch, i) => {
        if (ch !== to[i]) acc.push(i);
        return acc;
    }, []);
}

// ─── WordTiles ─────────────────────────────────────────────────────────────────

function WordTiles({ word, changedIndices = [], accentColor, tileSize = 44, fontSize = 20 }) {
    return (
        <View style={styles.tilesRow}>
            {word.split('').map((letter, i) => {
                const isChanged = changedIndices.includes(i);
                return (
                    <View
                        key={i}
                        style={[
                            styles.tile,
                            { width: tileSize, height: tileSize },
                            isChanged && { backgroundColor: accentColor },
                        ]}
                    >
                        <Text style={[styles.tileLetter, { fontSize }, isChanged && styles.tileLetterChanged]}>
                            {letter}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

// ─── Step sub-components ──────────────────────────────────────────────────────

function GoalStep({ step, accentColor }) {
    return (
        <View style={styles.stepBody}>
            <Text style={styles.bodyText}>{step.body}</Text>
            <View style={styles.goalRow}>
                <View style={[styles.goalChip, { borderColor: accentColor }]}>
                    <Text style={styles.goalChipText}>{step.startWord}</Text>
                </View>
                <Text style={styles.goalArrow}>→ ··· →</Text>
                <View style={[styles.goalChip, { borderColor: accentColor }]}>
                    <Text style={styles.goalChipText}>{step.endWord}</Text>
                </View>
            </View>
        </View>
    );
}

function TransformStep({ step, accentColor }) {
    const compact = step.examples.length >= 3;
    const tileSize = compact ? 36 : 44;
    const tileFontSize = compact ? 16 : 20;
    return (
        <View style={[styles.stepBody, compact && { gap: 8 }]}>
            <Text style={[styles.bodyText, compact && { fontSize: 13, lineHeight: 18 }]}>{step.body}</Text>
            {step.examples.map((ex, i) => {
                const changed = getChangedIndices(ex.from, ex.to);
                return (
                    <View key={i} style={[styles.exampleCard, compact && { padding: 10, gap: 6 }]}>
                        <View style={[styles.exampleWordCol, compact && { gap: 4 }]}>
                            <WordTiles word={ex.from} accentColor={accentColor} changedIndices={changed} tileSize={tileSize} fontSize={tileFontSize} />
                            <Text style={[styles.exArrowDown, compact && { fontSize: 15 }]}>↓</Text>
                            <WordTiles word={ex.to} accentColor={accentColor} changedIndices={changed} tileSize={tileSize} fontSize={tileFontSize} />
                        </View>
                        <Text style={styles.exNote}>{ex.note}</Text>
                    </View>
                );
            })}
        </View>
    );
}

function PuzzleStep({ step, level, accentColor, visibleWords }) {
    return (
        <View style={styles.stepBody}>
            <Text style={styles.bodyText}>{step.body}</Text>
            <View style={styles.chainsContainer}>
                {step.chains.map((chain, ci) => (
                    <View key={ci} style={styles.chain}>
                        {chain.label && (
                            <Text style={styles.chainLabel}>{chain.label}</Text>
                        )}
                        {chain.words.map((word, wi) => {
                            const prevWord = wi > 0 ? chain.words[wi - 1] : null;
                            const changed = prevWord ? getChangedIndices(prevWord, word) : [];
                            return (
                                <View key={wi} style={styles.puzzleWordGroup}>
                                    {visibleWords[`${ci}-${wi}`] ? (
                                        <WordTiles word={word} accentColor={accentColor} changedIndices={changed} tileSize={48} fontSize={22} />
                                    ) : (
                                        <View style={styles.wordPlaceholder} />
                                    )}
                                    {wi < chain.words.length - 1 && (
                                        <Text style={styles.puzzleArrow}>↓</Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>
        </View>
    );
}

function ScoringStep({ step }) {
    return (
        <View style={styles.stepBody}>
            {step.items.map((item, i) => (
                <View key={i} style={styles.scoringItem}>
                    <Text style={styles.scoringEmoji}>{item.emoji}</Text>
                    <Text style={styles.scoringText}>{item.text}</Text>
                </View>
            ))}
        </View>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TutorialModal({ level, visible, onComplete }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [visibleWords, setVisibleWords] = useState({});

    const steps = TUTORIALS[level] ?? TUTORIALS.One;
    const step = steps[stepIndex];
    const accentColor = levelColorScheme[level] ?? '#9ADBFA';
    const buttonColor = levelButtonColorScheme[level] ?? '#1A8FC4';
    const totalSteps = steps.length;

    // Reset on open
    useEffect(() => {
        if (visible) {
            setStepIndex(0);
            setVisibleWords({});
        }
    }, [visible]);

    // Animate puzzle words in one by one
    useEffect(() => {
        if (step?.type !== 'puzzle') return;
        setVisibleWords({});
        const allWords = [];
        step.chains.forEach((chain, ci) => {
            chain.words.forEach((_, wi) => allWords.push({ ci, wi }));
        });
        allWords.forEach(({ ci, wi }, idx) => {
            setTimeout(() => {
                setVisibleWords(prev => ({ ...prev, [`${ci}-${wi}`]: true }));
            }, idx * 450 + 300);
        });
    }, [stepIndex]);

    const goNext = () => {
        if (stepIndex < totalSteps - 1) setStepIndex(s => s + 1);
    };

    const goBack = () => {
        if (stepIndex > 0) setStepIndex(s => s - 1);
    };

    const rewatch = () => {
        setStepIndex(0);
        setVisibleWords({});
    };

    const isReady = step?.type === 'ready';

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent>
            <SafeAreaView style={[styles.root, { backgroundColor: accentColor }]}>
                {/* Progress dots */}
                <View style={styles.dotsRow}>
                    {steps.map((_, i) => (
                        <View
                            key={i}
                            style={[styles.dot, i === stepIndex && styles.dotActive]}
                        />
                    ))}
                </View>

                {/* Content card */}
                <View style={styles.card}>
                    <ScrollView
                        contentContainerStyle={styles.cardContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.stepTitle}>{step?.title}</Text>

                        {step?.type === 'goal' && (
                            <GoalStep step={step} accentColor={accentColor} />
                        )}
                        {step?.type === 'transform' && (
                            <TransformStep step={step} accentColor={accentColor} />
                        )}
                        {step?.type === 'puzzle' && (
                            <PuzzleStep
                                step={step}
                                level={level}
                                accentColor={accentColor}
                                visibleWords={visibleWords}
                            />
                        )}
                        {step?.type === 'scoring' && (
                            <ScoringStep step={step} />
                        )}

                        {isReady && (
                            <View style={styles.readyButtons}>
                                <TouchableOpacity
                                    style={[styles.playButton, { backgroundColor: buttonColor }]}
                                    onPress={onComplete}
                                >
                                    <Text style={styles.playButtonText}>Let's Play!</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.rewatchButton} onPress={rewatch}>
                                    <Text style={styles.rewatchText}>Rewatch Tutorial</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Navigation row — hidden on ready step */}
                {!isReady && (
                    <View style={styles.navRow}>
                        <TouchableOpacity
                            onPress={goBack}
                            disabled={stepIndex === 0}
                            style={[styles.navBackButton, stepIndex === 0 && { opacity: 0 }]}
                        >
                            <Text style={styles.navBackText}>← Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.navNextButton, { backgroundColor: buttonColor }]}
                            onPress={goNext}
                        >
                            <Text style={styles.navNextText}>Next →</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    dotActive: {
        backgroundColor: '#5B5A53',
        width: 20,
        borderRadius: 4,
    },
    card: {
        flexShrink: 1,
        backgroundColor: '#fff',
        borderRadius: 24,
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    cardContent: {
        padding: 24,
        paddingBottom: 32,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 20,
        textAlign: 'center',
    },

    // Step body
    stepBody: {
        gap: 16,
    },
    bodyText: {
        fontSize: 15,
        color: '#5B5A53',
        lineHeight: 22,
        textAlign: 'center',
    },

    // Goal step
    goalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 8,
    },
    goalChip: {
        borderWidth: 3,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    goalChipText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 3,
    },
    goalArrow: {
        fontSize: 16,
        color: '#888',
        fontWeight: '600',
    },

    // Transform step
    exampleCard: {
        backgroundColor: '#F8F8F8',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        gap: 10,
    },
    exampleWordCol: {
        alignItems: 'center',
        gap: 6,
    },
    exArrowDown: {
        fontSize: 20,
        color: '#888',
        fontWeight: '700',
    },
    exNote: {
        fontSize: 13,
        color: '#888',
        fontWeight: '600',
    },

    // Tiles
    tilesRow: {
        flexDirection: 'row',
        gap: 4,
    },
    tile: {
        borderWidth: 3,
        borderColor: '#1C1C1E',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileLetter: {
        fontWeight: '800',
        color: '#1C1C1E',
        textTransform: 'uppercase',
    },
    tileLetterChanged: {
        color: '#1C1C1E',
    },

    // Puzzle step
    chainsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: 20,
        marginTop: 8,
    },
    chain: {
        alignItems: 'center',
    },
    chainLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    puzzleWordGroup: {
        alignItems: 'center',
    },
    puzzleArrow: {
        fontSize: 20,
        color: '#888',
        marginVertical: 4,
    },
    wordPlaceholder: {
        width: 48 * 4 + 4 * 3,
        height: 48,
    },

    // Scoring step
    scoringItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 16,
        gap: 14,
    },
    scoringEmoji: {
        fontSize: 26,
    },
    scoringText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#5B5A53',
        flex: 1,
    },

    // Ready step buttons
    readyButtons: {
        marginTop: 16,
        gap: 12,
        alignItems: 'center',
    },
    playButton: {
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 48,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    playButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    rewatchButton: {
        paddingVertical: 10,
    },
    rewatchText: {
        fontSize: 14,
        color: '#888',
        fontWeight: '600',
    },

    // Nav row
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 8 : 20,
        paddingTop: 4,
    },
    navBackButton: {
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    navBackText: {
        fontSize: 15,
        color: '#5B5A53',
        fontWeight: '600',
    },
    navNextButton: {
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    navNextText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
