import { USER_STATE_CHANGE, WORD_LADDER_CHANGE, LEADERBOARD_CHANGE } from '../constants/index';
import axios from 'axios';
import config from '../../config';

export function fetchUser(auth) {
    return (async (dispatch) => {
        if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            await axios.post(`${config.WORD_LADDER_BACKEND}/api/getUser`, 
                { id: auth.currentUser.uid },
                { headers: { Authorization: `Bearer ${token}` } }
            ).then((response) => {
                let userData = response.data;
                dispatch({ type: USER_STATE_CHANGE, currentUser: userData })
            }).catch((e) => {
                console.error('Error fetching user:', e)
            })
        }
    })
}

export function getWordLadders(auth) {
    return (async (dispatch) => {
        if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            await axios.get(`${config.WORD_LADDER_BACKEND}/api/getPuzzles`,
                { headers: { Authorization: `Bearer ${token}` } }
            ).then((response) => {
                dispatch({
                    type: WORD_LADDER_CHANGE,
                    wordLadder: { "one": response.data.one, "two": response.data.two, "three": response.data.three || null }
                })
            }).catch((e) => {
                console.error('Error fetching puzzles:', e)
            })
        }
    })
}

export function fetchLeaderboard(level, category, auth) {
    return (async (dispatch) => {
        if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            await axios.post(
                `${config.WORD_LADDER_BACKEND}/api/leaderboard?level=${level}&category=${category}`,
                { userId: auth.currentUser.uid },
                { headers: { Authorization: `Bearer ${token}` } }
            ).then((response) => {
                dispatch({
                    type: LEADERBOARD_CHANGE,
                    level,
                    category,
                    data: response.data
                })
            }).catch((e) => {
                console.error('Error fetching leaderboard:', e)
            })
        }
    })
}

export function updateUser(id, userUpdate, auth) {
    return (async (dispatch) => {
        if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            await axios.post(`${config.WORD_LADDER_BACKEND}/api/updateUser`, 
                {id, userUpdate: userUpdate},
                { headers: { Authorization: `Bearer ${token}` } }
            ).then((response) => {
                dispatch({
                    type: USER_STATE_CHANGE,
                    currentUser: response.data
                })
            }).catch((e) => {
                console.error('Error updating user:', e)
            })
        }
    })
}
