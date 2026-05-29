import { USER_STATE_CHANGE, WORD_LADDER_CHANGE, LEADERBOARD_CHANGE, LEADERBOARD_GROUPS_CHANGE, GROUP_LEADERBOARD_CHANGE } from '../constants/index';
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

export function saveLeaderboardName(name, auth) {
    return (async (dispatch) => {
        if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            const response = await axios.put(
                `${config.WORD_LADDER_BACKEND}/api/leaderboardName`,
                { name },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            dispatch({ type: USER_STATE_CHANGE, currentUser: response.data });
            return response.data;
        }
    })
}

// ── Leaderboard Group actions ──────────────────────────────────────────────

export function fetchLeaderboardGroups(auth) {
    return (async (dispatch) => {
        if (!auth.currentUser) return;
        const token = await auth.currentUser.getIdToken();
        try {
            const res = await axios.get(
                `${config.WORD_LADDER_BACKEND}/api/leaderboard-groups`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            dispatch({ type: LEADERBOARD_GROUPS_CHANGE, groups: res.data });
        } catch (e) {
            console.error('Error fetching leaderboard groups:', e);
        }
    });
}

export function createLeaderboardGroup(name, auth) {
    return (async (dispatch) => {
        if (!auth.currentUser) return;
        const token = await auth.currentUser.getIdToken();
        const res = await axios.post(
            `${config.WORD_LADDER_BACKEND}/api/leaderboard-groups`,
            { name },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        // Re-fetch the full list so the new group is in Redux
        dispatch(fetchLeaderboardGroups(auth));
        return res.data;
    });
}

export function joinLeaderboardGroup(groupId, auth) {
    return (async (dispatch) => {
        if (!auth.currentUser) return;
        const token = await auth.currentUser.getIdToken();
        const res = await axios.post(
            `${config.WORD_LADDER_BACKEND}/api/leaderboard-groups/${groupId}/join`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        dispatch(fetchLeaderboardGroups(auth));
        return res.data;
    });
}

export function leaveLeaderboardGroup(groupId, auth) {
    return (async (dispatch) => {
        if (!auth.currentUser) return;
        const token = await auth.currentUser.getIdToken();
        await axios.post(
            `${config.WORD_LADDER_BACKEND}/api/leaderboard-groups/${groupId}/leave`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        dispatch(fetchLeaderboardGroups(auth));
    });
}

export function renameLeaderboardGroup(groupId, name, auth) {
    return (async (dispatch) => {
        if (!auth.currentUser) return;
        const token = await auth.currentUser.getIdToken();
        await axios.put(
            `${config.WORD_LADDER_BACKEND}/api/leaderboard-groups/${groupId}/rename`,
            { name },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        dispatch(fetchLeaderboardGroups(auth));
    });
}

export function fetchGroupLeaderboard(groupId, level, category, auth) {
    return (async (dispatch) => {
        if (!auth.currentUser) return;
        const token = await auth.currentUser.getIdToken();
        try {
            const res = await axios.post(
                `${config.WORD_LADDER_BACKEND}/api/leaderboard/group?groupId=${groupId}&level=${level}&category=${category}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            dispatch({ type: GROUP_LEADERBOARD_CHANGE, groupId, level, category, data: res.data });
        } catch (e) {
            console.error('Error fetching group leaderboard:', e);
        }
    });
}
