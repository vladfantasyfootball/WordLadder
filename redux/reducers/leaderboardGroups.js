import { LEADERBOARD_GROUPS_CHANGE, GROUP_LEADERBOARD_CHANGE } from '../constants/index';

const initialState = {
    // Array of { _id, name, createdBy, members, createdAt }
    groups: [],
    // Cached group leaderboard data: { [groupId]: { [level]: { [category]: data } } }
    groupLeaderboards: {},
};

export const leaderboardGroups = (state = initialState, action) => {
    switch (action.type) {
        case LEADERBOARD_GROUPS_CHANGE:
            return { ...state, groups: action.groups };

        case GROUP_LEADERBOARD_CHANGE:
            return {
                ...state,
                groupLeaderboards: {
                    ...state.groupLeaderboards,
                    [action.groupId]: {
                        ...(state.groupLeaderboards[action.groupId] || {}),
                        [action.level]: {
                            ...((state.groupLeaderboards[action.groupId] || {})[action.level] || {}),
                            [action.category]: action.data,
                        },
                    },
                },
            };

        default:
            return state;
    }
};
