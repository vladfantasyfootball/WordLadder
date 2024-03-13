import { getAuth } from "firebase/auth";
import { USER_STATE_CHANGE, WORD_LADDER_CHANGE } from '../constants/index';
import axios from 'axios';
import { Platform } from 'react-native';

export function fetchUser() {
    return (async (dispatch) => {
        const auth = getAuth();
        if (auth.currentUser) {
            await axios.post(Platform.OS === 'ios' ? 'http://localhost:3000/api/getUser' : 'http://10.0.2.2:3000/api/getUser', { id: auth.currentUser.uid }).then((response) => {
                let userData = response.data;
                dispatch({ type: USER_STATE_CHANGE, currentUser: userData })
            }).catch((e) => {
                console.log(e)
            })
        }
        else {
            console.log('does not exist'); 
        }
    })
}

export function getWordLadders() {
    return (async (dispatch) => {
        await axios.get(Platform.OS === 'ios' ? 'http://localhost:3000/api/getPuzzles' : 'http://10.0.2.2:3000/api/getPuzzles').then((response) => {
            dispatch({
                type: WORD_LADDER_CHANGE,
                wordLadder: { "one": response.data.one, "two": response.data.two }
            })
        }).catch((e) => {
            console.log(e)
        })
    })
}

export function updateUser(id, userUpdate) {
    return (async (dispatch) => {
        await axios.post(Platform.OS === 'ios' ? 'http://localhost:3000/api/updateUser' : 'http://10.0.2.2:3000/api/updateUser', {id, userUpdate: userUpdate}).then((response) => {
            dispatch({
                type: USER_STATE_CHANGE,
                currentUser: userUpdate
            })
        })
    })
}
