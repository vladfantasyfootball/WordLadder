import axios from 'axios';
import { Platform } from 'react-native';

const baseUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

export const validateWord = async (word) => {
    try {
        return axios.get(Platform.OS === 'ios' ? `http://localhost:3000/api/checkValidEnglishWord?word=${word}` : `http://10.0.2.2:3000/api/checkValidEnglishWord?word=${word}`).then((response) => {
            return response.data;
          }).catch((error) => {
            return false;
          });
    } catch (error){
        return false;
    }
}

export const validateLevelOneWord = (prevWord, nextWord) => {
    if(prevWord.length !== nextWord.length ){
        return false;
    }
    let letterMatches = 0;
    [...prevWord].forEach((letter, index) => {
        if ([...nextWord][index] === letter){
            letterMatches += 1;
        }
    });

    if(letterMatches !== prevWord.length -1){
        return false;
    }
    else {
        return true
    }
}

export const validateExtraLevelTwoRule = (prevWord, nextWord) => {
    if(prevWord.length !== nextWord.length ){
        return false;
    }
    if(prevWord === nextWord){
        return false
    }
    const prevWordArray = [...prevWord]
    const nextWordArray = [...nextWord]

    prevWordArray.forEach((letter) => {
        const index = nextWordArray.findIndex(a => a === letter);
        if(index > -1){
            nextWordArray.splice(index, 1);
        }
        else{
            return false
        }
    })
    return nextWordArray.length === 0;
}