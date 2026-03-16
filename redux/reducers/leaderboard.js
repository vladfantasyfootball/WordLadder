import { LEADERBOARD_CHANGE } from '../constants/index';

const initialState = {
    // { [level]: { [category]: { top10, total, userRank, percentileAhead, userScore } } }
};

export const leaderboard = (state = initialState, action) => {
    switch (action.type) {
        case LEADERBOARD_CHANGE:
            return {
                ...state,
                [action.level]: {
                    ...(state[action.level] || {}),
                    [action.category]: action.data,
                },
            };
        default:
            return state;
    }
};
