import { combineReducers, Action, Reducer, Dispatch } from "redux";
import { ThunkAction } from "redux-thunk";
import { ipcRenderer } from "electron";
import * as Constants from "../../common/constants";
import garoonReducer, { GaroonState, GaroonActions } from "./garoon";
import googleCalendarReducer, { GoogleCalendarState } from "./google-calendar";

/**
 * Actions
 */
const enum ActionTypes {
    Next = "tutorial/NEXT",
    Prev = "tutorial/PREV",
    SetStartSyncAfterTutorial = "tutorial/SET_START_SYNC_AFTER_TUTORIAL"
}

type TutorialActions = NextAction | PrevAction | SetStartSyncAfterTutorialAction;

interface NextAction extends Action {
    readonly type: ActionTypes.Next;
}

interface PrevAction extends Action {
    readonly type: ActionTypes.Prev;
}

interface SetStartSyncAfterTutorialAction extends Action {
    readonly type: ActionTypes.SetStartSyncAfterTutorial;
    readonly payload: boolean
}

/**
 * Action Creators
 */
export const next = (): NextAction => {
    return {
        type: ActionTypes.Next
    };
}

export const prev = (): PrevAction => {
    return {
        type: ActionTypes.Prev
    };
}

export const setStartSyncAfterTutorial = (start: boolean): SetStartSyncAfterTutorialAction => {
    return {
        type: ActionTypes.SetStartSyncAfterTutorial,
        payload: start
    };
}

export const submit = (): ThunkAction<void, TutorialState, void> => {
    return (dispatch: Dispatch<TutorialState>, getState: () => TutorialState) => {
        const state = getState();
        ipcRenderer.send(Constants.FinishTutorialSendChannel, state.googleCalendar.calendarId, state.tutorial.startSyncAfterTutorial);
    };
}

/**
  * State
  *
  * 小さいアプリなので、画面単位でState分けしてみる(あとでドメインごとに変えてみるかも)
  * @todo ページ数のvalidationをどこにおくか考える
  */
interface State {
    readonly stepIndex: number;
    readonly startSyncAfterTutorial: boolean;
}

const initialState: State = {
    stepIndex: 0,
    startSyncAfterTutorial: true
};

export interface TutorialState {
    tutorial: State
    garoon: GaroonState
    googleCalendar: GoogleCalendarState
}

/**
 * Reducer
 */
const tutorialReducer: Reducer<State> = (state: State = initialState, action: TutorialActions): State => {
    switch (action.type) {
        case ActionTypes.Next:
            return {...state, stepIndex: state.stepIndex + 1};
        case ActionTypes.Prev:
            return {...state, stepIndex: state.stepIndex - 1};
        case ActionTypes.SetStartSyncAfterTutorial:
            return {...state, startSyncAfterTutorial: action.payload};
        default:
            return state;
    }
 }

const reducer: Reducer<TutorialState> = combineReducers<TutorialState>({
    tutorial: tutorialReducer,
    garoon: garoonReducer,
    googleCalendar: googleCalendarReducer
});

export default reducer;
