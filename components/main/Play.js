import React, { Component } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { levelColorScheme } from '../../redux/constants/colorScheme';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchUser, getWordLadders, updateUser } from '../../redux/actions';
import LadderStepWord from '../shared/LadderStepWord'
import FlatButton from '../shared/button';
import { validateWord, validateLevelOneWord, validateExtraLevelTwoRule } from '../../utils/validations';
import LevelCompleteScreen, { completionBonusMap } from '../shared/LevelCompleteScreen';
import CustomKeyboard from '../shared/CustomKeyboard';
import { getAuth } from 'firebase/auth';

export class Play extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nextWord: '',
            ladderWords: this.props.currentUser.wordLadder[this.props.route.params.level.toLowerCase()].currentWordLadder.currentAttempt,
            gameCompleted: this.props.currentUser.wordLadder[this.props.route.params.level.toLowerCase()].currentWordLadder.completed,
            timeFinished: this.props.currentUser.wordLadder[this.props.route.params.level.toLowerCase()].currentWordLadder.completed
                ? this.props.currentUser.wordLadder[this.props.route.params.level.toLowerCase()].timeFinished
                : null,
        }
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

    onPress = async (level) => {
        if (level.toLowerCase() === "one" || level.toLowerCase() === "two") {
            const currentWord = this.state.nextWord.toLowerCase();
            const startingWord = this.props.wordLadder[level.toLowerCase()].startingWord.toLowerCase();
            const expectedLength = startingWord.length;
            
            // Check word length first (fast check)
            if (currentWord.length !== expectedLength) {
                Alert.alert('', `Word must be ${expectedLength} letters long.`);
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
                        this.setState({ gameCompleted: true, timeFinished: completionTime, ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, () => {
                            const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                            newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                            newUser.wordLadder[level.toLowerCase()].timeFinished = completionTime;
                            newUser.wordLadder[level.toLowerCase()].currentWordLadder.completed = true;
                            newUser.wordLadder[level.toLowerCase()].currentStreak = newUser.wordLadder[level.toLowerCase()].currentStreak + 1;
                            if(newUser.wordLadder[level.toLowerCase()].currentStreak > newUser.wordLadder[level.toLowerCase()].longestStreak){
                                newUser.wordLadder[level.toLowerCase()].longestStreak = newUser.wordLadder[level.toLowerCase()].currentStreak
                            }
                            newUser.wordLadder[level.toLowerCase()].lastSolved = newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentPuzzle;
                            let timeTaken = Math.round((newUser.wordLadder[level.toLowerCase()].timeFinished - newUser.wordLadder[level.toLowerCase()].timeStarted) / 1000);

                        // Time bonus: Start at 100 points, lose 5 points for every 30 seconds after 1 minute
                        let timeBonus = 100;
                        if (timeTaken > 60) {
                            const secondsOver = timeTaken - 60;
                            const thirtySecondIntervals = Math.floor(secondsOver / 30);
                            timeBonus = Math.max(0, 100 - (thirtySecondIntervals * 5));
                        }
                        const completionBonus = completionBonusMap[level.toLowerCase()];
                        const shortestLength = this.props.wordLadder[level.toLowerCase()].shortestSolution.length;
                        const userLength = this.state.ladderWords.length;
                        const wordBonus = Math.max(0, 100 - (userLength - shortestLength) * 5);
                        const totalRoundScore = timeBonus + completionBonus + wordBonus;
                            newUser.wordLadder[level.toLowerCase()].totalScore = newUser.wordLadder[level.toLowerCase()].totalScore + totalRoundScore;
                            if(totalRoundScore > newUser.wordLadder[level.toLowerCase()].highScore){
                                newUser.wordLadder[level.toLowerCase()].highScore = totalRoundScore;
                            }
    
                            this.props.updateUser(
                                this.props.currentUser.id, newUser, getAuth()
                            )
                        })
                    }
                    else {
                        this.setState({ ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, () => {
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
                                this.setState({ gameCompleted: true, timeFinished: completionTime, ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, () => {
                                    const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                                    newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                                    newUser.wordLadder[level.toLowerCase()].timeFinished = completionTime;
                                    newUser.wordLadder[level.toLowerCase()].currentWordLadder.completed = true;
                                    newUser.wordLadder[level.toLowerCase()].currentStreak = newUser.wordLadder[level.toLowerCase()].currentStreak + 1;
                                    if(newUser.wordLadder[level.toLowerCase()].currentStreak > newUser.wordLadder[level.toLowerCase()].longestStreak){
                                        newUser.wordLadder[level.toLowerCase()].longestStreak = newUser.wordLadder[level.toLowerCase()].currentStreak
                                    }
                                    newUser.wordLadder[level.toLowerCase()].lastSolved = newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentPuzzle;
                                    let timeTaken = Math.round((newUser.wordLadder[level.toLowerCase()].timeFinished - newUser.wordLadder[level.toLowerCase()].timeStarted) / 1000);

                                // Time bonus: Start at 100 points, lose 5 points for every 30 seconds after 1 minute
                                let timeBonus = 100;
                                if (timeTaken > 60) {
                                    const secondsOver = timeTaken - 60;
                                    const thirtySecondIntervals = Math.floor(secondsOver / 30);
                                    timeBonus = Math.max(0, 100 - (thirtySecondIntervals * 5));
                                }
                                const completionBonus = completionBonusMap[level.toLowerCase()];
                                const shortestLength = this.props.wordLadder[level.toLowerCase()].shortestSolution.length;
                                const userLength = this.state.ladderWords.length;
                                const wordBonus = Math.max(0, 100 - (userLength - shortestLength) * 5);
                                const totalRoundScore = timeBonus + completionBonus + wordBonus;
                                    newUser.wordLadder[level.toLowerCase()].totalScore = newUser.wordLadder[level.toLowerCase()].totalScore + totalRoundScore;
                                    if(totalRoundScore > newUser.wordLadder[level.toLowerCase()].highScore){
                                        newUser.wordLadder[level.toLowerCase()].highScore = totalRoundScore;
                                    }
                                    this.props.updateUser(
                                        this.props.currentUser.id, newUser, getAuth()
                                    )
                                })
                            }
                            else {
                                this.setState({ ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, () => {
                                    const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                                    newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                                    this.props.updateUser(
                                        this.props.currentUser.id, newUser, getAuth()
                                    )
                                })
                            }
                        } else {
                            Alert.alert(
                                '',
                                'Not a valid word transformation',
                                [
                                    { text: 'OK', style: 'cancel' },
                                    { text: 'View Rules', onPress: () => {
                                        this.props.navigation.goBack();
                                        setTimeout(() => {
                                            this.props.route.params?.onShowRules?.();
                                        }, 100);
                                    }}
                                ]
                            )
                        }
                    } else {
                        Alert.alert(
                            '',
                            'Not a valid word transformation',
                            [
                                { text: 'OK', style: 'cancel' },
                                { text: 'View Rules', onPress: () => {
                                    this.props.navigation.goBack();
                                    setTimeout(() => {
                                        this.props.route.params?.onShowRules?.();
                                    }, 100);
                                }}
                            ]
                        )
                    }
                }
            } else {
                Alert.alert('', 'Word does not exist.');
                this.setState({ nextWord: '' });
            }
        }
    }

    renderInput = () => {
        return (
            <View style={{ paddingBottom: 10 }}>
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

    componentDidMount() {
        const level = this.props.route.params.level.toLowerCase();
        const newUser = JSON.parse(JSON.stringify(this.props.currentUser));
        
        // Set timeStarted when user opens puzzle for the first time
        if (!newUser.wordLadder[level].timeStarted) {
            newUser.wordLadder[level].timeStarted = Date.now();
        }
        
        // Set currentPuzzle ID when puzzle is first loaded
        if (this.props.wordLadder && this.props.wordLadder[level] && this.props.wordLadder[level].id) {
            if (!newUser.wordLadder[level].currentWordLadder.currentPuzzle) {
                newUser.wordLadder[level].currentWordLadder.currentPuzzle = this.props.wordLadder[level].id;
            }
        }
        
        if(this.state.ladderWords.length === 0 ){
            if(
                this.props.wordLadder && this.props.wordLadder[level]
            ){
                this.setState({ ladderWords: [this.props.wordLadder[level].startingWord]}, () => {
                    newUser.wordLadder[level].currentWordLadder.currentAttempt = [this.props.wordLadder[level].startingWord];
                    this.props.updateUser(
                        this.props.currentUser.id, newUser, getAuth()
                    )
                })
            }
        } else {
            // Update user even if ladderWords already exist (to set timeStarted and currentPuzzle)
            this.props.updateUser(
                this.props.currentUser.id, newUser, getAuth()
            )
        }
    }

    render() {
        const { route, wordLadder } = this.props;
        const level = route.params.level;
        return (
            <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: levelColorScheme[level] }]}>
                {this.state.gameCompleted &&
                    <View>
                        <LevelCompleteScreen 
                            completeLadder={this.state.ladderWords} 
                            level={level}
                            shortestSolution={wordLadder[level.toLowerCase()].shortestSolution}
                            timeStarted={this.props.currentUser.wordLadder[level.toLowerCase()].timeStarted}
                            timeFinished={this.state.timeFinished}
                        />
                    </View>
                }

                {!this.state.gameCompleted &&
                    <View style={[styles.container, { backgroundColor: levelColorScheme[level] }]}>
                        <View style={{ alignItems: 'center', marginTop: 5, marginBottom: 10 }}>
                            <LadderStepWord word={wordLadder[level.toLowerCase()].startingWord} size={62} fontSize={44} />
                        </View>
                        <View
                            style={{
                                borderTopColor: 'black',
                                borderTopWidth: 2,
                            }}
                        />
                        {this.state.ladderWords.length > 1 &&
                            <ScrollView
                                contentContainerStyle={{ alignItems: 'center', paddingTop: 10, marginTop: 5, paddingBottom: 5, backgroundColor: `${levelColorScheme[level]}`, justifyContent: 'center' }}
                                ref={ref => { this.scrollView = ref }}
                                onContentSizeChange={() => this.scrollView.scrollToEnd({ animated: true })}
                                persistentScrollbar={true}>
                                {this.state.ladderWords.slice(1).map((ladderWord, index) => {
                                    const isLastWord = this.state.ladderWords.length - 2 === index;
                                    return (
                                        <View key={`arrow-${index}`} style={[styles.rowStyle, { display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' }]}>                                               
                                            <View style={{ width: 60, alignItems: 'flex-end', paddingRight: 10 }}>
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
                                                    size={isLastWord ? 62 : 50}
                                                    fontSize={isLastWord ? 44 : 32}
                                                />
                                            </View>
                                            <View style={{ width: 60 }} />
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
                        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 10 }}>
                            <LadderStepWord word={wordLadder[level.toLowerCase()].endingWord} size={62} fontSize={44} />
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
        paddingVertical: 15,
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
const mapDispatchProps = (dispatch) => bindActionCreators({ fetchUser, getWordLadders, updateUser }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Play);