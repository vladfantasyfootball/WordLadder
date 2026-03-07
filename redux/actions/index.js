import { USER_STATE_CHANGE, WORD_LADDER_CHANGE } from '../constants/index';
import axios from 'axios';
import config from '../../config';

export function fetchUser(auth) {
    return (async (dispatch) => {
        if (auth.currentUser) {
            await axios.post(`${config.WORD_LADDER_BACKEND}/api/getUser`, { id: auth.currentUser.uid }).then((response) => {
                let userData = response.data;
                dispatch({ type: USER_STATE_CHANGE, currentUser: userData })
            }).catch((e) => {
                console.error('Error fetching user:', e)
            })
        }
    })
}

export function getWordLadders() {
    return (async (dispatch) => {
        await axios.get(`${config.WORD_LADDER_BACKEND}/api/getPuzzles`).then((response) => {
            dispatch({
                type: WORD_LADDER_CHANGE,
                wordLadder: { "one": response.data.one, "two": response.data.two }
            })
        }).catch((e) => {
            console.error('Error fetching puzzles:', e)
        })
    })
}

export function updateUser(id, userUpdate) {
    return (async (dispatch) => {
        await axios.post(`${config.WORD_LADDER_BACKEND}/api/updateUser`, {id, userUpdate: userUpdate}).then((response) => {
            dispatch({
                type: USER_STATE_CHANGE,
                currentUser: userUpdate
            })
        })
    })
}
