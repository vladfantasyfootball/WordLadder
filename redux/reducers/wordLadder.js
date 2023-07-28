const initialState = {
    wordLadder: {
        startingWord: "",
        endingWord: "",
        id: "",
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