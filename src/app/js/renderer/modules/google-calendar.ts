import { Action, Reducer, Dispatch } from "redux";
import { ThunkAction } from "redux-thunk";
import { ipcRenderer } from "electron";
import { next, TutorialState } from "./tutorial";
import * as Constants from "../../common/constants";
import {Calendar} from "../../common/google";

/**
 * Actions
 */
const enum ActionTypes {
    SetAuthorizationCode = "google_calendar/SET_AUTHORIZATION_CODE",
    StartVerifyAuthorizationCode = "google_calendar/START_VERIFY_AUTHORIZATION_CODE",
    EndVerifyAuthorizationCode = "google_calendar/END_VERIFY_AUTHORIZATION_CODE",
    SetCalendarsCode = "google_calendar/SET_CALENDARS_CODE",
    SelectCalendarCode = "google_calendar/SELECT_CALENDAR_CODE",
    StartCalendarLoadCode = "google_calendar/START_CALENDAR_LOAD_CODE",
    EndCalendarLoadCode = "google_calendar/END_CALENDAR_LOAD_CODE"
}

type GooleCalendarActions =
    SetAuthorizationCodeAction |
    StartVerifyAuthorizationCodeAction |
    EndVerifyAuthorizationCodeAction |
    SetCalendarsAction |
    SelectCalendarAction |
    StartCalendarLoadCodeAction |
    EndCalendarLoadCodeAction;

interface SetAuthorizationCodeAction extends Action {
    readonly type: ActionTypes.SetAuthorizationCode
    readonly payload: string
}

interface StartVerifyAuthorizationCodeAction extends Action {
    readonly type: ActionTypes.StartVerifyAuthorizationCode
}

interface EndVerifyAuthorizationCodeAction extends Action {
    readonly type: ActionTypes.EndVerifyAuthorizationCode
    readonly payload: {state: CodeVerifyState, result: CodeVerifyResult}
}

interface SelectCalendarAction extends Action {
    readonly type: ActionTypes.SelectCalendarCode
    readonly payload: string
}

interface SetCalendarsAction extends Action {
    readonly type: ActionTypes.SetCalendarsCode,
    readonly payload: Calendar[]
}

interface StartCalendarLoadCodeAction extends Action {
    readonly type: ActionTypes.StartCalendarLoadCode
}

interface EndCalendarLoadCodeAction extends Action {
    readonly type: ActionTypes.EndCalendarLoadCode
    readonly payload: {state: CalendarLoadState, result: CalendarLoadResult}
}

/**
 * Action Creators
 */
export const openAuthorizationView = <State>(): ThunkAction<void, State, void> => {
    return (dispatch: Dispatch<State>) => {
        ipcRenderer.send(Constants.OpenGoogleCalendarAuthorizationViewSendChannel);
    }
}

export const setAuthorizationCode = (code: string): SetAuthorizationCodeAction => {
    return {
        type: ActionTypes.SetAuthorizationCode,
        payload: code
    };
}

export const setCalendars = (calendars: Calendar[]): SetCalendarsAction => {
    return {
        type: ActionTypes.SetCalendarsCode,
        payload: calendars
    };
}

/**
 * コードの確認開始状態にする
 */
export const startVerifyAuthorizationCode = (): StartVerifyAuthorizationCodeAction => {
    return {
        type: ActionTypes.StartVerifyAuthorizationCode
    };
}

/**
 * コードの確認終了状態にする
 */
export const endVerifyAuthorizationCode = (state: CodeVerifyState, result: CodeVerifyResult): EndVerifyAuthorizationCodeAction => {
    return {
        type: ActionTypes.EndVerifyAuthorizationCode,
        payload: {state: state, result: result}
    };
}

export const submit = <State>(getGoogleCalendarState: (baseState: State) => GoogleCalendarState): ThunkAction<void, State, void> => {
    return (dispatch: Dispatch<State>, getState: () => State) => {
        // バリデート→Mainプロセスに問い合わせ→handleNext
        const state = getGoogleCalendarState(getState());
        const code = state.authorizationCode;
        dispatch(startVerifyAuthorizationCode());
        ipcRenderer.send(Constants.VerifyGoogleCalendarAuthorizationCodeSendChannel, code);
        ipcRenderer.once(Constants.VerifyGoogleCalendarAuthorizationCodeResponseChannel, (event: Electron.Event, result: Constants.VerifyGoogleCalendarAuthorizationCodeResponseType): void => {
            if (result) {
                dispatch(endVerifyAuthorizationCode(CodeVerifyState.Verified, CodeVerifyResult.Valid));
                dispatch(next());
                dispatch(loadWritableCalendars(getGoogleCalendarState));
            } else {
                dispatch(endVerifyAuthorizationCode(CodeVerifyState.Verified, CodeVerifyResult.Invalid));
            }
        });
    };
}

export const selectCalendar = (event: any, index: number, menuItemValue: string): SelectCalendarAction => {
    return {
        type: ActionTypes.SelectCalendarCode,
        payload: menuItemValue
    };
}

/**
 * カレンダーのロード開始状態にする
 */
export const startCalendarLoad = (): StartCalendarLoadCodeAction => {
    return {
        type: ActionTypes.StartCalendarLoadCode
    };
}

/**
 * カレンダーのロード終了状態にする
 */
export const endCalendarLoad = (state: CalendarLoadState, result: CalendarLoadResult): EndCalendarLoadCodeAction => {
    return {
        type: ActionTypes.EndCalendarLoadCode,
        payload: {state: state, result: result}
    };
}

export const loadWritableCalendars = <State>(getGoogleCalendarState: (baseState: State) => GoogleCalendarState): ThunkAction<void, State, void> => {
    return (dispatch: Dispatch<State>, getState: () => State) => {
        dispatch(startCalendarLoad());
        ipcRenderer.send(Constants.GetWritableGoogleCalendarsSendChannel);
        ipcRenderer.once(Constants.GetWritableGoogleCalendarsResponseChannel, (event: Electron.Event, result: Constants.GetWritableGoogleCalendarsResponseType): void => {
            if (result) {
                dispatch(setCalendars(result));
                dispatch(endCalendarLoad(CalendarLoadState.Loaded, CalendarLoadResult.Success));
            } else {
                dispatch(endCalendarLoad(CalendarLoadState.Loaded, CalendarLoadResult.Error));
            }
        });
    }
}

 /**
  * State
  */
interface CodeVerifying {
    readonly state: CodeVerifyState
    readonly result: CodeVerifyResult
}

export const enum CodeVerifyState {
    Initial,
    Verifying,
    Verified // verify is end. See result whether verifying is success or not.
}

export const enum CodeVerifyResult {
    Unknown, // initial state
    Valid, // Account is valid.
    Invalid, // Account is invalid.
    Error // something wrong happen.
}

interface CalendarLoading {
    readonly state: CalendarLoadState
    readonly result: CalendarLoadResult
}

export const enum CalendarLoadState {
    Initial,
    Loading,
    Loaded // loading is end. See result whether verifying is success or not.
}

export const enum CalendarLoadResult {
    Unknown, // initial state
    Success,
    Error
}

export interface GoogleCalendarState {
    readonly verifying: CodeVerifying; // コードの認証中状態
    readonly authorizationCode: string;
    readonly calendars: Calendar[]
    readonly calendarId?: string; // 同期先として選択されたカレンダーのID
    readonly calendarLoading: CalendarLoading;
}

const initialState: GoogleCalendarState = {
    verifying: {state: CodeVerifyState.Initial, result: CodeVerifyResult.Unknown},
    authorizationCode: "",
    calendars: [],
    calendarLoading: {state: CalendarLoadState.Initial, result: CalendarLoadResult.Unknown}
};

/**
 * Reducer
 */
const reducer: Reducer<GoogleCalendarState> = (state: GoogleCalendarState = initialState, action: GooleCalendarActions): GoogleCalendarState => {
    switch (action.type) {
        case ActionTypes.SetAuthorizationCode:
            return {...state, authorizationCode: action.payload};
        case ActionTypes.StartVerifyAuthorizationCode:
            return {...state, verifying: {...state.verifying, state: CodeVerifyState.Verifying}};
        case ActionTypes.EndVerifyAuthorizationCode:
            return {...state, verifying: {...state.verifying, state: action.payload.state, result: action.payload.result}};
        case ActionTypes.SetCalendarsCode:
            return {...state, calendarId: undefined, calendars: action.payload};
        case ActionTypes.SelectCalendarCode:
            return {...state, calendarId: action.payload};
        case ActionTypes.StartCalendarLoadCode:
            return {...state, calendarLoading: {...state.calendarLoading, state: CalendarLoadState.Loading}};
        case ActionTypes.EndCalendarLoadCode:
            return {...state, calendarLoading: {...state.calendarLoading, state: action.payload.state, result: action.payload.result}};
        default:
            return state;
    }
 }

export default reducer;
