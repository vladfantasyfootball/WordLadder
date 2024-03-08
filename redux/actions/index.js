import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { USER_STATE_CHANGE, WORD_LADDER_CHANGE } from '../constants/index';
import axios from 'axios';
import { user } from '../reducers/user';

export function fetchUser() {
    return (async (dispatch) => {
        const auth = getAuth();
        if (auth.currentUser) {
            await axios.post('http://localhost:3000/api/getUser', { id: auth.currentUser.uid }).then((response) => {
                let userData = response.data;
                dispatch({ type: USER_STATE_CHANGE, currentUser: userData })
            })
        }
        else {
            console.log('does not exist');
        }
    })
}

export function getWordLadders() {
    return (async (dispatch) => {
        await axios.get('http://localhost:3000/api/getPuzzles').then((response) => {
            dispatch({
                type: WORD_LADDER_CHANGE,
                wordLadder: { "one": response.data.one, "two": response.data.two }
            })
        })
    })
}

export function updateUser(id, userUpdate) {
    return (async (dispatch) => {
        await axios.post('http://localhost:3000/api/updateUser', {id, userUpdate: userUpdate}).then((response) => {
            dispatch({
                type: USER_STATE_CHANGE,
                currentUser: userUpdate
            })
        })
    })
}
