import { englishWords, blockedWords } from "./validEnglishWords";

export const isBlockedWord = (word) => blockedWords.has(word.toUpperCase());

export const validateWord = async (word) => {
    try {
        return englishWords.has(word.toUpperCase());
    } catch (error) {
        return null;
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

    for (const letter of prevWordArray) {
        const index = nextWordArray.findIndex(a => a === letter);
        if(index > -1){
            nextWordArray.splice(index, 1);
        }
        else{
            return false;
        }
    }
    return nextWordArray.length === 0;
}

// Level Three extra rules: insertion (add one letter) or deletion (remove one letter)
// Words must be 4-6 letters long.
// These are checked AFTER level one (substitution) and level two (anagram) already failed.
const MIN_LEVEL_THREE_LENGTH = 4;
const MAX_LEVEL_THREE_LENGTH = 6;

export const validateExtraLevelThreeRules = (prevWord, nextWord) => {
    if (prevWord === nextWord) return false;
    if (nextWord.length < MIN_LEVEL_THREE_LENGTH || nextWord.length > MAX_LEVEL_THREE_LENGTH) return false;

    const lenDiff = nextWord.length - prevWord.length;

    if (lenDiff === 1) {
        // Insertion: nextWord has one more letter than prevWord
        // Check that prevWord can be found as a subsequence by removing exactly one letter from nextWord
        for (let i = 0; i < nextWord.length; i++) {
            const candidate = nextWord.slice(0, i) + nextWord.slice(i + 1);
            if (candidate === prevWord) return true;
        }
        return false;
    }

    if (lenDiff === -1) {
        // Deletion: nextWord has one fewer letter than prevWord
        // Check that nextWord can be found by removing exactly one letter from prevWord
        for (let i = 0; i < prevWord.length; i++) {
            const candidate = prevWord.slice(0, i) + prevWord.slice(i + 1);
            if (candidate === nextWord) return true;
        }
        return false;
    }

    return false;
}