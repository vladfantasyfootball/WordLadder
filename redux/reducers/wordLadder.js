const initialState = {
    wordLadder: {
        "one": {
            startingWord: "",
            endingWord: "",
            id: "",
        },
        "two": {
            startingWord: "",
            endingWord: "",
            id: "",
        },
        "three": {
            startingWord: "",
            endingWord: "",
            id: "",
        },
    }
}

export const wordLadder = (state = initialState, action) => {
    switch(action.type){ 
        case "WORD_LADDER_CHANGE":
            return {
                ...state,
                wordLadder: action.wordLadder,
            }
        default: 
            return {
                ...state,
            }
    }
        
    
}