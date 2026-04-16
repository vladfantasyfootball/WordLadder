import React, { Component } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Alert, TouchableOpacity, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { levelColorScheme, levelButtonColorScheme } from '../../redux/constants/colorScheme';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { updateUser } from '../../redux/actions';
import LadderStepWord from '../shared/LadderStepWord'
import FlatButton from '../shared/button';
import { validateWord, validateLevelOneWord, validateExtraLevelTwoRule, validateExtraLevelThreeRules, isBlockedWord } from '../../utils/validations';
import LevelCompleteScreen, { completionBonusMap } from '../shared/LevelCompleteScreen';
import TutorialModal from '../shared/TutorialModal';
import CustomKeyboard from '../shared/CustomKeyboard';
import { getAuth } from 'firebase/auth';
import { Ionicons, SimpleLineIcons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';

export class Play extends Component {
    constructor(props) {
        super(props);
        const levelKey = this.props.route.params.level.toLowerCase();
        const levelData = this.props.currentUser.wordLadder[levelKey];
        const alreadyCompleted = levelData.currentWordLadder.completed;
        const isFirstOpen = !levelData.timeStarted;
        this.state = {
            nextWord: '',
            ladderWords: levelData.currentWordLadder.currentAttempt,
            gameCompleted: alreadyCompleted,
            timeFinished: alreadyCompleted ? levelData.timeFinished : null,
            prevStats: null,
            showHintModal: !alreadyCompleted && isFirstOpen,
            showTutorial: false,
        };
        // Prevents mid-game step saves from racing with / overwriting the completion save
        this._completing = false;
        this._undoPlayer = createAudioPlayer(require('../../assets/sounds/undo.wav'));
        this._submitPlayer = createAudioPlayer(require('../../assets/sounds/submit.wav'));
        this._errorPlayer = createAudioPlayer(require('../../assets/sounds/error.mp3'));
    }

    onChangeNextWord = (nextWord) => {
        // Only allow letters
        const lettersOnly = nextWord.replace(/[^a-zA-Z]/g, '');
        this.setState({ nextWord: lettersOnly.toUpperCase() })
    }

    handleKeyPress = (key) => {
        if (key === 'BACKSPACE') {
            this.setState({ nextWord: this.state.nextWord.slice(0, -1) });
        } else {
            this.setState({ nextWord: this.state.nextWord + key.toUpperCase() });
        }
    }

    _playSubmit = () => {
        try { this._submitPlayer.seekTo(0); this._submitPlayer.play(); } catch (e) {}
    }

    _playError = () => {
        try { this._errorPlayer.seekTo(0); this._errorPlayer.play(); } catch (e) {}
    }

    onPress = async (level) => {
        if (level.toLowerCase() === "one" || level.toLowerCase() === "two") {
            const currentWord = this.state.nextWord.toLowerCase();
            const startingWord = this.props.wordLadder[level.toLowerCase()].startingWord.toLowerCase();
            const expectedLength = startingWord.length;
            
            // Check word length first (fast check)
            if (currentWord.length !== expectedLength) {
                this._playError();
                Alert.alert('', `Word must be ${expectedLength} letters long.`);
                this.setState({ nextWord: '' });
                return;
            }

            // Blocked word + valid transformation check
            const prevWordL12 = (this.state.ladderWords.length > 1
                ? this.state.ladderWords[this.state.ladderWords.length - 1]
                : this.props.wordLadder[level.toLowerCase()].startingWord
            ).toLowerCase();
            if (isBlockedWord(currentWord) && (
                validateLevelOneWord(prevWordL12, currentWord) ||
                (level.toLowerCase() === 'two' && validateExtraLevelTwoRule(prevWordL12, currentWord))
            )) {
                this._playError();
                Alert.alert('', 'Not an appropriate word.');
                this.setState({ nextWord: '' });
                return;
            }

            const validWord = await validateWord(currentWord)
            if (validWord) {
                if (validateLevelOneWord(this.state.ladderWords.length > 1 ?
                    this.state.ladderWords[this.state.ladderWords.length - 1].toLowerCase() :
                    this.props.wordLadder[level.toLowerCase()].startingWord.toLowerCase(),
                    this.state.nextWord.toLowerCase())) {
                    if (this.state.nextWord.toLowerCase() === this.props.wordLadder[level.toLowerCase()].endingWord.toLowerCase()) {
                        const completionTime = Date.now();
                        const prevStats = {
                                    totalScore: this.props.currentUser.wordLadder[level.toLowerCase()].totalScore || 0,
                                    highScore: this.props.currentUser.wordLadder[level.toLowerCase()].highScore || 0,
                                    currentStreak: this.props.currentUser.wordLadder[level.toLowerCase()].currentStreak || 0,
                                    totalSolved: this.props.currentUser.wordLadder[level.toLowerCase()].totalSolved || 0,
                                };
                        this._completing = true;
                        this.setState({ gameCompleted: true, timeFinished: completionTime, prevStats, ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, async () => {
                            const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                            newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                            newUser.wordLadder[level.toLowerCase()].timeFinished = completionTime;
                            newUser.wordLadder[level.toLowerCase()].currentWordLadder.completed = true;
                            newUser.wordLadder[level.toLowerCase()].currentStreak = newUser.wordLadder[level.toLowerCase()].currentStreak + 1;
                            if(newUser.wordLadder[level.toLowerCase()].currentStreak > newUser.wordLadder[level.toLowerCase()].longestStreak){
                                newUser.wordLadder[level.toLowerCase()].longestStreak = newUser.wordLadder[level.toLowerCase()].currentStreak
                            }
                            newUser.wordLadder[level.toLowerCase()].lastSolved = newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentPuzzle;
                            newUser.wordLadder[level.toLowerCase()].totalSolved = (newUser.wordLadder[level.toLowerCase()].totalSolved || 0) + 1;
                            let timeTaken = Math.round((newUser.wordLadder[level.toLowerCase()].timeFinished - newUser.wordLadder[level.toLowerCase()].timeStarted) / 1000);
                        const completionBonus = completionBonusMap[level.toLowerCase()];
                        const shortestLength = this.props.wordLadder[level.toLowerCase()].shortestSolution.length;
                        const userLength = this.state.ladderWords.length;
                        const overBy = userLength - shortestLength;
                        const wordBonus = overBy === 0 ? 100 : Math.max(0, 50 - (overBy - 1) * 5);
                        const timeBonus = timeTaken < 60 ? 100 : Math.max(0, 50 - Math.floor((timeTaken - 60) / 12));
                        const totalRoundScore = timeBonus + completionBonus + wordBonus;
                            newUser.wordLadder[level.toLowerCase()].totalScore = newUser.wordLadder[level.toLowerCase()].totalScore + totalRoundScore;
                            if(totalRoundScore > newUser.wordLadder[level.toLowerCase()].highScore){
                                newUser.wordLadder[level.toLowerCase()].highScore = totalRoundScore;
                            }
    
                            await this.props.updateUser(
                                this.props.currentUser.id, newUser, getAuth()
                            );
                        })
                    }
                    else {
                        this._playSubmit();
                        this.setState({ ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, () => {
                            if (this._completing) return;
                            const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                            newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                            this.props.updateUser(
                                this.props.currentUser.id, newUser, getAuth()
                            )
                        })
                    }
                }
                else {
                    if (level.toLowerCase() === "two") {
                        if (validateExtraLevelTwoRule(this.state.ladderWords.length > 1 ?
                            this.state.ladderWords[this.state.ladderWords.length - 1].toLowerCase() :
                            this.props.wordLadder[level.toLowerCase()].startingWord.toLowerCase(),
                            this.state.nextWord.toLowerCase())) {
                            if (this.state.nextWord.toLowerCase() === this.props.wordLadder[level.toLowerCase()].endingWord.toLowerCase()) {
                                const completionTime = Date.now();
                                const prevStats = {
                                    totalScore: this.props.currentUser.wordLadder[level.toLowerCase()].totalScore || 0,
                                    highScore: this.props.currentUser.wordLadder[level.toLowerCase()].highScore || 0,
                                    currentStreak: this.props.currentUser.wordLadder[level.toLowerCase()].currentStreak || 0,
                                    totalSolved: this.props.currentUser.wordLadder[level.toLowerCase()].totalSolved || 0,
                                };
                                this._completing = true;
                                this.setState({ gameCompleted: true, timeFinished: completionTime, prevStats, ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, async () => {
                                    const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                                    newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                                    newUser.wordLadder[level.toLowerCase()].timeFinished = completionTime;
                                    newUser.wordLadder[level.toLowerCase()].currentWordLadder.completed = true;
                                    newUser.wordLadder[level.toLowerCase()].currentStreak = newUser.wordLadder[level.toLowerCase()].currentStreak + 1;
                                    if(newUser.wordLadder[level.toLowerCase()].currentStreak > newUser.wordLadder[level.toLowerCase()].longestStreak){
                                        newUser.wordLadder[level.toLowerCase()].longestStreak = newUser.wordLadder[level.toLowerCase()].currentStreak
                                    }
                                    newUser.wordLadder[level.toLowerCase()].lastSolved = newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentPuzzle;
                                    newUser.wordLadder[level.toLowerCase()].totalSolved = (newUser.wordLadder[level.toLowerCase()].totalSolved || 0) + 1;
                                    let timeTaken = Math.round((newUser.wordLadder[level.toLowerCase()].timeFinished - newUser.wordLadder[level.toLowerCase()].timeStarted) / 1000);

                                const completionBonus = completionBonusMap[level.toLowerCase()];
                                const shortestLength = this.props.wordLadder[level.toLowerCase()].shortestSolution.length;
                                const userLength = this.state.ladderWords.length;
                                const overBy = userLength - shortestLength;
                                const wordBonus = overBy === 0 ? 100 : Math.max(0, 50 - (overBy - 1) * 5);
                                const timeBonus = timeTaken < 60 ? 100 : Math.max(0, 50 - Math.floor((timeTaken - 60) / 12));
                                const totalRoundScore = timeBonus + completionBonus + wordBonus;
                                    newUser.wordLadder[level.toLowerCase()].totalScore = newUser.wordLadder[level.toLowerCase()].totalScore + totalRoundScore;
                                    if(totalRoundScore > newUser.wordLadder[level.toLowerCase()].highScore){
                                        newUser.wordLadder[level.toLowerCase()].highScore = totalRoundScore;
                                    }
                                    await this.props.updateUser(
                                        this.props.currentUser.id, newUser, getAuth()
                                    );
                                })
                            }
                            else {
                                this._playSubmit();
                                this.setState({ ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, () => {
                                    if (this._completing) return;
                                    const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                                    newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                                    this.props.updateUser(
                                        this.props.currentUser.id, newUser, getAuth()
                                    )
                                })
                            }
                        } else {
                            this._playError();
                            Alert.alert(
                                '',
                                'Not a valid word transformation',
                                [
                                    { text: 'OK', style: 'cancel' },
                                    { text: 'View Rules', onPress: () => this.setState({ showTutorial: true }) }
                                ]
                            )
                        }
                    } else {
                        this._playError();
                        Alert.alert(
                            '',
                            'Not a valid word transformation',
                            [
                                { text: 'OK', style: 'cancel' },
                                { text: 'View Rules', onPress: () => this.setState({ showTutorial: true }) }
                            ]
                        )
                    }
                }
            } else {
                this._playError();
                Alert.alert('', 'Word does not exist.');
                this.setState({ nextWord: '' });
            }
        } else if (level.toLowerCase() === "three") {
            const currentWord = this.state.nextWord.toLowerCase();
            const prevWord = (this.state.ladderWords.length > 1
                ? this.state.ladderWords[this.state.ladderWords.length - 1]
                : this.props.wordLadder[level.toLowerCase()].startingWord
            ).toLowerCase();

            // Level 3 words must be 4-6 letters
            if (currentWord.length < 4 || currentWord.length > 6) {
                this._playError();
                Alert.alert('', 'Word must be 4 to 6 letters long.');
                this.setState({ nextWord: '' });
                return;
            }

            // Blocked word + valid transformation check
            if (isBlockedWord(currentWord) && (
                validateLevelOneWord(prevWord, currentWord) ||
                validateExtraLevelTwoRule(prevWord, currentWord) ||
                validateExtraLevelThreeRules(prevWord, currentWord)
            )) {
                this._playError();
                Alert.alert('', 'Not an appropriate word.');
                this.setState({ nextWord: '' });
                return;
            }

            const validWord = await validateWord(currentWord);
            if (validWord) {
                const isSubstitution = validateLevelOneWord(prevWord, currentWord);
                const isAnagram = validateExtraLevelTwoRule(prevWord, currentWord);
                const isInsertionOrDeletion = validateExtraLevelThreeRules(prevWord, currentWord);

                if (isSubstitution || isAnagram || isInsertionOrDeletion) {
                    if (currentWord === this.props.wordLadder[level.toLowerCase()].endingWord.toLowerCase()) {
                        const completionTime = Date.now();
                        const prevStats = {
                            totalScore: this.props.currentUser.wordLadder[level.toLowerCase()].totalScore || 0,
                            highScore: this.props.currentUser.wordLadder[level.toLowerCase()].highScore || 0,
                            currentStreak: this.props.currentUser.wordLadder[level.toLowerCase()].currentStreak || 0,
                            totalSolved: this.props.currentUser.wordLadder[level.toLowerCase()].totalSolved || 0,
                        };
                        this._completing = true;
                        this.setState({ gameCompleted: true, timeFinished: completionTime, prevStats, ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, async () => {
                            const newUser = JSON.parse(JSON.stringify(this.props.currentUser));
                            newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                            newUser.wordLadder[level.toLowerCase()].timeFinished = completionTime;
                            newUser.wordLadder[level.toLowerCase()].currentWordLadder.completed = true;
                            newUser.wordLadder[level.toLowerCase()].currentStreak = newUser.wordLadder[level.toLowerCase()].currentStreak + 1;
                            if (newUser.wordLadder[level.toLowerCase()].currentStreak > newUser.wordLadder[level.toLowerCase()].longestStreak) {
                                newUser.wordLadder[level.toLowerCase()].longestStreak = newUser.wordLadder[level.toLowerCase()].currentStreak;
                            }
                            newUser.wordLadder[level.toLowerCase()].lastSolved = newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentPuzzle;
                            newUser.wordLadder[level.toLowerCase()].totalSolved = (newUser.wordLadder[level.toLowerCase()].totalSolved || 0) + 1;
                            let timeTaken = Math.round((newUser.wordLadder[level.toLowerCase()].timeFinished - newUser.wordLadder[level.toLowerCase()].timeStarted) / 1000);
                            const completionBonus = completionBonusMap[level.toLowerCase()];
                            const shortestLength = this.props.wordLadder[level.toLowerCase()].shortestSolution.length;
                            const userLength = this.state.ladderWords.length;
                            const overBy = userLength - shortestLength;
                            const wordBonus = overBy === 0 ? 100 : Math.max(0, 50 - (overBy - 1) * 5);
                            const timeBonus = timeTaken < 60 ? 100 : Math.max(0, 50 - Math.floor((timeTaken - 60) / 12));
                            const totalRoundScore = timeBonus + completionBonus + wordBonus;
                            newUser.wordLadder[level.toLowerCase()].totalScore = newUser.wordLadder[level.toLowerCase()].totalScore + totalRoundScore;
                            if (totalRoundScore > newUser.wordLadder[level.toLowerCase()].highScore) {
                                newUser.wordLadder[level.toLowerCase()].highScore = totalRoundScore;
                            }
                            await this.props.updateUser(this.props.currentUser.id, newUser, getAuth());
                        });
                    } else {
                        this._playSubmit();
                        this.setState({ ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, () => {
                            if (this._completing) return;
                            const newUser = JSON.parse(JSON.stringify(this.props.currentUser));
                            newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                            this.props.updateUser(this.props.currentUser.id, newUser, getAuth());
                        });
                    }
                } else {
                    this._playError();
                    Alert.alert(
                        '',
                        'Not a valid word transformation',
                        [
                            { text: 'OK', style: 'cancel' },
                            { text: 'View Rules', onPress: () => this.setState({ showTutorial: true }) }
                        ]
                    );
                }
            } else {
                this._playError();
                Alert.alert('', 'Word does not exist.');
                this.setState({ nextWord: '' });
            }
        }
    }

    getTileSize = (word, isActive) => {
        return { size: isActive ? 46 : 42, fontSize: isActive ? 30 : 26 };
    }

    undoLastWord = () => {
        // Can't undo past the starting word
        if (this.state.ladderWords.length <= 1) return;
        try { this._undoPlayer.seekTo(0); this._undoPlayer.play(); } catch (e) {}
        const newLadderWords = this.state.ladderWords.slice(0, -1);
        this.setState({ ladderWords: newLadderWords }, () => {
            if (this._completing) return;
            const newUser = JSON.parse(JSON.stringify(this.props.currentUser));
            const level = this.props.route.params.level.toLowerCase();
            newUser.wordLadder[level].currentWordLadder.currentAttempt = newLadderWords;
            this.props.updateUser(this.props.currentUser.id, newUser, getAuth());
        });
    }

    renderInput = () => {
        return (
            <View style={{ paddingBottom: 4 }}>
                <View style={styles.inputContainer}>
                    <View style={styles.wordDisplay}>
                        <Text style={[
                            styles.wordDisplayText,
                            !this.state.nextWord && styles.placeholderText
                        ]}>
                            {this.state.nextWord || 'Next word'}
                        </Text>
                    </View>
                </View>
                <CustomKeyboard 
                    onKeyPress={this.handleKeyPress}
                    onSubmit={() => { this.onPress(this.props.route.params.level) }}
                    disabled={this.state.gameCompleted}
                    submitDisabled={this.state.nextWord.length === 0}
                    levelColor={levelColorScheme[this.props.route.params.level]}
                />
            </View>
        )
    }

    componentWillUnmount() {
        try { this._undoPlayer.remove(); } catch (e) {}
        try { this._submitPlayer.remove(); } catch (e) {}
        try { this._errorPlayer.remove(); } catch (e) {}
    }

    componentDidMount() {
        const level = this.props.route.params.level.toLowerCase();
        const newUser = JSON.parse(JSON.stringify(this.props.currentUser));

        // timeStarted is null when: first ever open, or backend reset it for a new puzzle day.
        // It is only ever set here, so this is a reliable "first open of this puzzle" guard.
        // Backgrounding and reopening won't re-increment because timeStarted will already be set.
        const isFirstOpen = !newUser.wordLadder[level].timeStarted;

        if (isFirstOpen) {
            newUser.wordLadder[level].timeStarted = Date.now();
            newUser.wordLadder[level].totalAttempted = (newUser.wordLadder[level].totalAttempted || 0) + 1;
            newUser.wordLadder[level].lastAttempted = newUser.wordLadder[level].currentWordLadder.currentPuzzle;
        }

        if (isFirstOpen || this.state.ladderWords.length === 0) {
            if (this.props.wordLadder && this.props.wordLadder[level]) {
                const startingWord = this.props.wordLadder[level].startingWord.toLowerCase();
                newUser.wordLadder[level].currentWordLadder.currentAttempt = [startingWord];
                this.setState({ ladderWords: [startingWord], gameCompleted: false }, () => {
                    this.props.updateUser(this.props.currentUser.id, newUser, getAuth());
                });
            }
        } else {
            // Returning to an in-progress or completed puzzle — persist timeStarted if it was just set
            this.props.updateUser(this.props.currentUser.id, newUser, getAuth());
        }
    }

    render() {
        const { route, wordLadder } = this.props;
        const level = route.params.level;
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: levelColorScheme[level] }]}>
                {this.state.gameCompleted &&
                    <View style={{ flex: 1 }}>
                        <LevelCompleteScreen 
                            completeLadder={this.state.ladderWords} 
                            level={level}
                            shortestSolution={wordLadder[level.toLowerCase()].shortestSolution ?? []}
                            timeStarted={this.props.currentUser.wordLadder[level.toLowerCase()].timeStarted}
                            timeFinished={this.state.timeFinished}
                            prevStats={this.state.prevStats}
                            navigation={this.props.navigation}
                        />
                    </View>
                }

                <TutorialModal
                    level={level}
                    visible={this.state.showTutorial}
                    onComplete={() => this.setState({ showTutorial: false })}
                />

                <Modal
                    visible={this.state.showHintModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => this.setState({ showHintModal: false })}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalEmoji}>{'🪜'}</Text>
                            <Text style={styles.modalTitle}>{'Shortest Ladder'}</Text>
                            <Text style={styles.modalLength}>
                                {`${(wordLadder[level.toLowerCase()]?.shortestSolution?.length ?? 1) - 1} steps`}
                            </Text>
                            <Text style={styles.modalSubtitle}>{'includes ending word'}</Text>
                            <Text style={styles.modalChallenge}>{'Can you find it?'}</Text>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: levelButtonColorScheme[level] }]}
                                onPress={() => this.setState({ showHintModal: false })}
                            >
                                <Text style={styles.modalButtonText}>{"Let's go!"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {!this.state.gameCompleted &&
                    <View style={[styles.container, { backgroundColor: levelColorScheme[level] }]}>
                        <View style={{ alignItems: 'center', marginTop: 5, marginBottom: 10 }}>
                            <LadderStepWord word={wordLadder[level.toLowerCase()].startingWord} size={this.getTileSize(wordLadder[level.toLowerCase()].startingWord, true).size} fontSize={this.getTileSize(wordLadder[level.toLowerCase()].startingWord, true).fontSize} />
                        </View>
                        <View
                            style={{
                                borderTopColor: 'black',
                                borderTopWidth: 2,
                            }}
                        />
                        {this.state.ladderWords.length > 1 &&
                            <ScrollView
                                contentContainerStyle={{ alignItems: 'center', paddingTop: 10, marginTop: 5, paddingBottom: 48, backgroundColor: `${levelColorScheme[level]}`, justifyContent: 'center' }}
                                ref={ref => { this.scrollView = ref }}
                                onContentSizeChange={() => this.scrollView.scrollToEnd({ animated: true })}
                                onLayout={() => this.scrollView && this.scrollView.scrollToEnd({ animated: false })}
                                persistentScrollbar={true}>
                                {this.state.ladderWords.slice(1).map((ladderWord, index) => {
                                    const isLastWord = this.state.ladderWords.length - 2 === index;
                                    return (
                        <View key={`arrow-${index}`} style={[styles.rowStyle, { display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' }]}>                                               
                                            <View style={{ width: 52, alignItems: 'flex-end', paddingRight: 6 }}>
                                                {isLastWord && 
                                                    <Text style={{ fontSize: 20 }}>
                                                        {"->"}
                                                    </Text>
                                                }
                                            </View>
                                            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                                <LadderStepWord
                                                    key={`ladderWord-${index}`}
                                                    word={ladderWord}
                                                    level={level}
                                                    size={this.getTileSize(ladderWord, isLastWord).size}
                                                    fontSize={this.getTileSize(ladderWord, isLastWord).fontSize}
                                                />
                                            </View>
                                            <View style={{ width: 52, alignItems: 'flex-start', paddingLeft: 4, paddingRight: 10 }}>
                                                {isLastWord && this.state.ladderWords.length > 1 &&
                                                    <TouchableOpacity
                                                        onPress={this.undoLastWord}
                                                        style={{ padding: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 20 }}
                                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                    >
                                                        <SimpleLineIcons name="action-undo" size={26} color="#333" />
                                                    </TouchableOpacity>
                                                }
                                            </View>
                                        </View>
                                    )
                                })}
                            </ScrollView>
                        }
                        <View
                            style={{
                                borderBottomColor: 'black',
                                borderBottomWidth: 2,
                                marginTop: 'auto',
                            }}
                        />
                        <View style={{ alignItems: 'center', paddingTop: 5, paddingBottom: 5 }}>
                            <LadderStepWord word={wordLadder[level.toLowerCase()].endingWord} size={this.getTileSize(wordLadder[level.toLowerCase()].endingWord, true).size} fontSize={this.getTileSize(wordLadder[level.toLowerCase()].endingWord, true).fontSize} />
                        </View>
                        {this.renderInput()}
                    </View>
                }
            </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        height: '100%',
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 32,
        paddingHorizontal: 36,
        alignItems: 'center',
        width: '78%',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    modalEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    modalTitle: {
        fontWeight: '800',
        fontSize: 26,
        color: '#5B5A53',
        textAlign: 'center',
        marginBottom: 6,
    },
    modalLength: {
        fontWeight: '800',
        fontSize: 38,
        color: '#5B5A53',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#5B5A53',
        textAlign: 'center',
        opacity: 0.6,
        marginTop: 4,
        marginBottom: 16,
    },
    modalChallenge: {
        fontWeight: '700',
        fontSize: 17,
        color: '#5B5A53',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButton: {
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 36,
    },
    modalButtonText: {
        fontWeight: '800',
        fontSize: 16,
        color: 'white',
    },
    wordDisplay: {
        flex: 1,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#878A8C',
        borderRadius: 8,
        padding: 15,
        minHeight: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wordDisplayText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000000',
        letterSpacing: 2,
    },
    placeholderText: {
        fontStyle: 'italic',
        fontWeight: '400',
        color: '#999999',
        letterSpacing: 0,
    },
    rowStyle: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center'
    }
});

const mapStateToProps = (store) => ({
    currentUser: store.userState.currentUser,
    wordLadder: store.wordLadderState.wordLadder,
})
const mapDispatchProps = (dispatch) => bindActionCreators({ updateUser }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Play);