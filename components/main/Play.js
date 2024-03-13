import React, { Component } from 'react';
import { SafeAreaView, Keyboard, View, Text, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native'
import { levelColorScheme } from '../../redux/constants/colorScheme';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { fetchUser, getWordLadders, updateUser } from '../../redux/actions';
import LadderStepWord from '../shared/LadderStepWord'
import { TextInput } from 'react-native';
import FlatButton from '../shared/button';
import { validateWord, validateLevelOneWord, validateExtraLevelTwoRule } from '../../utils/validations';
import LevelCompleteScreen, { completionBonusMap } from '../shared/LevelCompleteScreen';

export class Play extends Component {
    constructor(props) {
        super(props);
        this.state = {
            nextWord: '',
            ladderWords: this.props.currentUser.wordLadder[this.props.route.params.level.toLowerCase()].currentWordLadder.currentAttempt,
            gameCompleted: this.props.currentUser.wordLadder[this.props.route.params.level.toLowerCase()].currentWordLadder.completed,
        }
    }

    onChangeNextWord = (nextWord) => {
        this.setState({ nextWord: nextWord })
    }

    onPress = async (level) => {
        if (level.toLowerCase() === "one" || level.toLowerCase() === "two") {
            const validWord = await validateWord(this.state.nextWord.toLowerCase())
            if (validWord) {
                if (validateLevelOneWord(this.state.ladderWords.length > 1 ?
                    this.state.ladderWords[this.state.ladderWords.length - 1].toLowerCase() :
                    this.props.wordLadder[level.toLowerCase()].startingWord.toLowerCase(),
                    this.state.nextWord.toLowerCase())) {
                    if (this.state.nextWord.toLowerCase() === this.props.wordLadder[level.toLowerCase()].endingWord.toLowerCase()) {
                        this.setState({ gameCompleted: true, ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, () => {
                            const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                            newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                            newUser.wordLadder[level.toLowerCase()].timeFinished = Date.now();
                            newUser.wordLadder[level.toLowerCase()].currentWordLadder.completed = true;
                            newUser.wordLadder[level.toLowerCase()].currentStreak = newUser.wordLadder[level.toLowerCase()].currentStreak + 1;
                            if(newUser.wordLadder[level.toLowerCase()].currentStreak > newUser.wordLadder[level.toLowerCase()].longestStreak){
                                newUser.wordLadder[level.toLowerCase()].longestStreak = newUser.wordLadder[level.toLowerCase()].currentStreak
                            }
                            newUser.wordLadder[level.toLowerCase()].lastSolved = newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentPuzzle;
                            let timeTaken = Math.round(Math.abs(((newUser.wordLadder[level.toLowerCase()].timeFinished - newUser.wordLadder[level.toLowerCase()].timeStarted)) / 1000));
    
                            const timeBonus = 180 - timeTaken > 0 ? 180 - timeTaken : 0;
                            const completionBonus = completionBonusMap[level.toLowerCase()];
                            const wordBonus = Math.floor(200 - this.state.ladderWords.length * 10) > 0 ? Math.floor(180 - this.state.ladderWords.length * 10) : 0;
                            const totalRoundScore = timeBonus + completionBonus + wordBonus;
                            newUser.wordLadder[level.toLowerCase()].totalScore = newUser.wordLadder[level.toLowerCase()].totalScore + totalRoundScore;
                            if(totalRoundScore > newUser.wordLadder[level.toLowerCase()].highScore){
                                newUser.wordLadder[level.toLowerCase()].highScore = totalRoundScore;
                            }
    
                            this.props.updateUser(
                                this.props.currentUser.id, newUser
                            )
                        })
                    }
                    else {
                        this.setState({ ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, () => {
                            const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                            newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                            this.props.updateUser(
                                this.props.currentUser.id, newUser
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
                                this.setState({ gameCompleted: true, ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, () => {
                                    const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                                    newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                                    newUser.wordLadder[level.toLowerCase()].timeFinished = Date.now();
                                    newUser.wordLadder[level.toLowerCase()].currentWordLadder.completed = true;
                                    newUser.wordLadder[level.toLowerCase()].currentStreak = newUser.wordLadder[level.toLowerCase()].currentStreak + 1;
                                    if(newUser.wordLadder[level.toLowerCase()].currentStreak > newUser.wordLadder[level.toLowerCase()].longestStreak){
                                        newUser.wordLadder[level.toLowerCase()].longestStreak = newUser.wordLadder[level.toLowerCase()].currentStreak
                                    }
                                    newUser.wordLadder[level.toLowerCase()].lastSolved = newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentPuzzle;
                                    let timeTaken = Math.round(Math.abs(((newUser.wordLadder[level.toLowerCase()].timeFinished - newUser.wordLadder[level.toLowerCase()].timeStarted)) / 1000));
    
                                    const timeBonus = 180 - timeTaken > 0 ? 180 - timeTaken : 0;
                                    const completionBonus = completionBonusMap[level.toLowerCase()];
                                    const wordBonus = Math.floor(200 - this.state.ladderWords.length * 10) > 0 ? Math.floor(180 - this.state.ladderWords.length * 10) : 0;
                                    const totalRoundScore = timeBonus + completionBonus + wordBonus;
                                    newUser.wordLadder[level.toLowerCase()].totalScore = newUser.wordLadder[level.toLowerCase()].totalScore + totalRoundScore;
                                    if(totalRoundScore > newUser.wordLadder[level.toLowerCase()].highScore){
                                        newUser.wordLadder[level.toLowerCase()].highScore = totalRoundScore;
                                    }
                                    this.props.updateUser(
                                        this.props.currentUser.id, newUser
                                    )
                                })
                            }
                            else {
                                this.setState({ ladderWords: [...this.state.ladderWords, this.state.nextWord.toLowerCase()], nextWord: '' }, () => {
                                    const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                                    newUser.wordLadder[level.toLowerCase()].currentWordLadder.currentAttempt = this.state.ladderWords;
                                    this.props.updateUser(
                                        this.props.currentUser.id, newUser
                                    )
                                })
                            }
                        } else {
                            alert('Not a valid word')
                        }
                    } else {
                        alert('Not a valid word')
                    }
                }
            } else {
                alert('Not a real word')
            }
        }
    }

    renderInput = () => {
        return (
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                }}>
                <TextInput
                    style={styles.nextWordInput}
                    value={this.state.nextWord}
                    onChangeText={(e) => { this.onChangeNextWord(e.toUpperCase()) }}
                    placeholder={'Next Word'}
                    textAlign='center'
                    autoCapitalize='characters'
                    editable={!this.state.gameCompleted}
                />
                <FlatButton text={'GO'} onPress={() => { this.onPress(this.props.route.params.level) }} width='20' disabled={this.state.gameCompleted} />
            </View>
        )
    }

    componentDidMount() {
        if(this.state.ladderWords.length === 0 ){
            if(
                this.props.wordLadder && this.props.wordLadder[this.props.route.params.level.toLowerCase()]
            ){
                this.setState({ ladderWords: [this.props.wordLadder[this.props.route.params.level.toLowerCase()].startingWord]}, () => {
                    const newUser = JSON.parse(JSON.stringify(this.props.currentUser))
                    newUser.wordLadder[this.props.route.params.level.toLowerCase()].currentWordLadder.currentAttempt = [this.props.wordLadder[this.props.route.params.level.toLowerCase()].startingWord];
                    this.props.updateUser(
                        this.props.currentUser.id, newUser
                    )
                })
            }
        }
    }

    render() {
        const { route, wordLadder } = this.props;
        const level = route.params.level;
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: levelColorScheme[level] }]}>
                {this.state.gameCompleted &&
                    <View>
                        <LevelCompleteScreen completeLadder={this.state.ladderWords} level={level} />
                    </View>
                }

                {!this.state.gameCompleted &&
                    <View style={[styles.container, { backgroundColor: levelColorScheme[level] }]}>
                        <View style={{ alignItems: 'center', marginTop: 5, marginBottom: 10 }}>
                            <LadderStepWord word={wordLadder[level.toLowerCase()].startingWord} size={62} fontSize={50} />
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
                                    return (
                                        <View key={`arrow-${index}`} style={[styles.rowStyle, {display: 'flex', justifyContent: 'center'}, this.state.ladderWords.length - 2 !== index && {marginLeft: 105}]}>                                               
                                            {this.state.ladderWords.length - 2 === index && 
                                                <Text style={{marginRight:'auto', paddingRight: 20, marginTop: 25 ,fontSize: 20, marginLeft: 42}}>
                                                    {"->"}
                                                </Text>
                                            }
                                            <LadderStepWord
                                                key={`ladderWord-${index}`}
                                                word={ladderWord}
                                                level={level}
                                                size={this.state.ladderWords.length - 2 === index ? 62 : 50}
                                                fontSize={this.state.ladderWords.length - 2 === index ? 50 : 32}
                                            />
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
                        <View style={{ alignItems: 'center', paddingTop: 10 }}>
                            <LadderStepWord word={wordLadder[level.toLowerCase()].endingWord} size={62} fontSize={50} />
                        </View>
                        {Platform.OS === 'android' ? (
                            this.renderInput()
                        ) : (
                            <KeyboardAvoidingView
                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                keyboardVerticalOffset={Platform.select({ ios: 80, android: 500 })}>
                                {this.renderInput()}
                            </KeyboardAvoidingView>
                        )}
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
    nextWordInput: {
        borderWidth: 1,
        backgroundColor: 'white',
        width: '70%',
        fontSize: 26,
        borderRadius: 15,
        padding: 5,
        textAlign: 'center',
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