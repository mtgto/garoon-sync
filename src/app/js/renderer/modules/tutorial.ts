import { ipcRenderer } from "electron";
import { Action, ActionCreator, AnyAction, combineReducers, Reducer } from "redux";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import * as Constants from "../../common/constants";
import garoonReducer, { GaroonState } from "./garoon";
import googleCalendarReducer, { GoogleCalendarState } from "./google-calendar";

/**
 * Actions
 */
const enum ActionTypes {
    Next = "tutorial/NEXT",
    Prev = "tutorial/PREV",
    SetStartSyncAfterTutorial = "tutorial/SET_START_SYNC_AFTER_TUTORIAL",
}

type TutorialActions = NextAction | PrevAction | SetStartSyncAfterTutorialAction;

export interface NextAction extends Action<string> {
    readonly type: ActionTypes.Next;
}

export interface PrevAction extends Action<string> {
    readonly type: ActionTypes.Prev;
}

export interface SetStartSyncAfterTutorialAction extends Action<string> {
    readonly type: ActionTypes.SetStartSyncAfterTutorial;
    readonly payload: boolean;
}

export type SubmitAction = ThunkAction<any, TutorialState, void, AnyAction>;

/**
 * Action Creators
 */
export const next: ActionCreator<NextAction> = (): NextAction => ({
    type: ActionTypes.Next,
});

export const prev: ActionCreator<PrevAction> = (): PrevAction => ({
    type: ActionTypes.Prev,
});

export const setStartSyncAfterTutorial: ActionCreator<SetStartSyncAfterTutorialAction> = (
    start: boolean,
): SetStartSyncAfterTutorialAction => ({
    type: ActionTypes.SetStartSyncAfterTutorial,
    payload: start,
});

export const submit: ActionCreator<SubmitAction> = (): SubmitAction => (
    dispatch: ThunkDispatch<TutorialState, void, AnyAction>,
    getState: () => TutorialState,
) => {
    const state = getState();
    ipcRenderer.send(
        Constants.FinishTutorialSendChannel,
        state.googleCalendar.calendarId,
        state.tutorial.startSyncAfterTutorial,
    );
};

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
    startSyncAfterTutorial: true,
};

export interface TutorialState {
    tutorial: State;
    garoon: GaroonState;
    googleCalendar: GoogleCalendarState;
}

/**
 * Reducer
 */
const tutorialReducer: Reducer<State> = (state: State = initialState, action: TutorialActions): State => {
    switch (action.type) {
        case ActionTypes.Next:
            return { ...state, stepIndex: state.stepIndex + 1 };
        case ActionTypes.Prev:
            return { ...state, stepIndex: state.stepIndex - 1 };
        case ActionTypes.SetStartSyncAfterTutorial:
            return { ...state, startSyncAfterTutorial: action.payload };
        default:
            return state;
    }
};

const reducer: Reducer<TutorialState> = combineReducers<TutorialState>({
    tutorial: tutorialReducer,
    garoon: garoonReducer,
    googleCalendar: googleCalendarReducer,
});

export default reducer;
