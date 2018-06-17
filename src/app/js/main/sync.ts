import * as moment from "moment-timezone";
import { Action, Dispatch, Reducer } from "redux";

/**
 * Redux Actions, State, Reducer for Synchronizer.
 */

export type Progress = {
    num: number;
    den: number;
}; // (numerator / denominator)

/**
 * Actions
 */
const enum ActionTypes {
    StartFetchGaroon = "sync/START_FETCH_GAROON",
    EndFetchGaroon = "sync/END_FETCH_GAROON",
    StartSyncGoogleCalendar = "sync/START_SYNC_GOOGLE_CALENDAR",
    EndSyncGoogleCalendar = "sync/END_SYNC_GOOGLE_CALENDAR",
    UpdateProgress = "sync/UPDATE_PROGRESS",
    EndSync = "sync/END_SYNC",
}

type SyncActions =
    | StartFetchGaroonAction
    | EndFetchGaroonAction
    | StartSyncGoogleCalendar
    | EndSyncGoogleCalendarAction
    | UpdateProgressAction
    | EndSyncAction;

interface StartFetchGaroonAction extends Action {
    readonly type: ActionTypes.StartFetchGaroon;
}

interface EndFetchGaroonAction extends Action {
    readonly type: ActionTypes.EndFetchGaroon;
    readonly payload: SyncResult;
}

interface StartSyncGoogleCalendar extends Action {
    readonly type: ActionTypes.StartSyncGoogleCalendar;
}

interface EndSyncGoogleCalendarAction extends Action {
    readonly type: ActionTypes.EndSyncGoogleCalendar;
    readonly payload: SyncResult;
}

interface UpdateProgressAction extends Action {
    readonly type: ActionTypes.UpdateProgress;
    readonly payload: Progress;
}

interface EndSyncAction extends Action {
    readonly type: ActionTypes.EndSync;
    readonly payload: SyncResult;
}

/**
 * Action Creators
 */
export const startFetchGaroon = (): StartFetchGaroonAction => {
    return {
        type: ActionTypes.StartFetchGaroon,
    };
};

export const endFetchGaroon = (result: SyncResult): EndFetchGaroonAction => {
    return {
        type: ActionTypes.EndFetchGaroon,
        payload: result,
    };
};

export const startSyncGoogleCalendar = (): StartSyncGoogleCalendar => {
    return {
        type: ActionTypes.StartSyncGoogleCalendar,
    };
};

export const endSyncGoogleCalendar = (result: SyncResult): EndSyncGoogleCalendarAction => {
    return {
        type: ActionTypes.EndSyncGoogleCalendar,
        payload: result,
    };
};

export const updateProgress = (progress: Progress): UpdateProgressAction => {
    return {
        type: ActionTypes.UpdateProgress,
        payload: progress,
    };
};

export const endSync = (result: SyncResult): EndSyncAction => {
    return {
        type: ActionTypes.EndSync,
        payload: result,
    };
};

/**
 * State
 */
interface Syncing {
    readonly state: SyncState;
    readonly result: SyncResult;
}

export const enum SyncState {
    Initial,
    FetchingGaroon,
    SyncingGoogleCalendar,
}
// todo: add cancelled ?
export const enum SyncResult {
    Unknown, // initial state or syncing.
    Success,
    Failed,
}

export interface State {
    readonly syncing: Syncing;
    readonly progress: Progress; // [numerator, denominator]
    readonly lastSyncTime?: moment.Moment;
}

const initialState: State = {
    syncing: { state: SyncState.Initial, result: SyncResult.Unknown },
    progress: { num: 0, den: 1 },
};

/**
 * Reducer
 */
const reducer: Reducer<State> = (state: State = initialState, action: SyncActions): State => {
    switch (action.type) {
        case ActionTypes.StartFetchGaroon:
            return {
                ...state,
                syncing: { ...state.syncing, state: SyncState.FetchingGaroon, result: SyncResult.Unknown },
            };
        case ActionTypes.EndFetchGaroon:
            return { ...state, syncing: { ...state.syncing, result: action.payload } };
        case ActionTypes.StartSyncGoogleCalendar:
            return {
                ...state,
                syncing: { ...state.syncing, state: SyncState.SyncingGoogleCalendar, result: SyncResult.Unknown },
            };
        case ActionTypes.EndSyncGoogleCalendar:
            return { ...state, syncing: { ...state.syncing, result: action.payload } };
        case ActionTypes.UpdateProgress:
            return { ...state, progress: action.payload };
        case ActionTypes.EndSync:
            if (action.payload === SyncResult.Success) {
                // Update last sync time.
                return {
                    ...state,
                    syncing: { ...state.syncing, state: SyncState.Initial, result: action.payload },
                    progress: { num: 0, den: 1 },
                    lastSyncTime: moment(),
                };
            } else {
                return {
                    ...state,
                    syncing: { ...state.syncing, state: SyncState.Initial, result: action.payload },
                    progress: { num: 0, den: 1 },
                };
            }
        default:
            return state;
    }
};
export default reducer;
