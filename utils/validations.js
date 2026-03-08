import { englishWords } from "./validEnglishWords";

export const validateWord = async (word) => {
    try {
        return englishWords.has(word.toUpperCase());
    } catch (error) {
        console.log(error);
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