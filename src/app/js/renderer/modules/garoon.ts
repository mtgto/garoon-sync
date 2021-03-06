import { ipcRenderer } from "electron";
import { Action, ActionCreator, Dispatch, Reducer } from "redux";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import * as url from "url";
import * as Constants from "../../common/constants";
import { GaroonAccount } from "../../common/garoon";
import { next, NextAction, TutorialState } from "./tutorial";

/**
 * Actions
 */
const enum ActionTypes {
    StartVerifyAccount = "garoon/START_VERIFY_ACCOUNT",
    EndVerifyAccount = "garoon/END_VERIFY_ACCOUNT",
    ValidateAccount = "garoon/VALIDATE_ACCOUNT",
    SetServerUrl = "garoon/SET_SERVER_URL",
    SetUsername = "garoon/SET_USERNAME",
    SetPassword = "garoon/SET_PASSWORD",
    SetEventPageUrl = "garoon/SET_EVENT_PAGE_URL",
}

export type GaroonActions =
    | StartVerifyAccountAction
    | EndVerifyAccountAction
    | ValidateAccountAction
    | SetServerUrlAction
    | SetUsernameAction
    | SetPasswordAction
    | SetEventPageUrlAction;

interface StartVerifyAccountAction extends Action<string> {
    readonly type: ActionTypes.StartVerifyAccount;
}

interface EndVerifyAccountAction extends Action<string> {
    readonly type: ActionTypes.EndVerifyAccount;
    readonly payload: { state: VerifyState; result: VerifyResult };
}

interface ValidateAccountAction extends Action<string> {
    readonly type: ActionTypes.ValidateAccount;
}

export interface SetServerUrlAction extends Action<string> {
    readonly type: ActionTypes.SetServerUrl;
    readonly payload: string;
}

export interface SetUsernameAction extends Action<string> {
    readonly type: ActionTypes.SetUsername;
    readonly payload: string;
}

export interface SetPasswordAction extends Action<string> {
    readonly type: ActionTypes.SetPassword;
    readonly payload: string;
}

export interface SetEventPageUrlAction extends Action<string> {
    readonly type: ActionTypes.SetEventPageUrl;
    readonly payload: string;
}

/**
 * Action Creators
 */
export const startVerify: ActionCreator<StartVerifyAccountAction> = (): StartVerifyAccountAction => ({
    type: ActionTypes.StartVerifyAccount,
});

export const endVerify: ActionCreator<EndVerifyAccountAction> = (
    state: VerifyState,
    result: VerifyResult,
): EndVerifyAccountAction => {
    return {
        type: ActionTypes.EndVerifyAccount,
        payload: {
            state,
            result,
        },
    };
};

export const validate: ActionCreator<ValidateAccountAction> = (): ValidateAccountAction => ({
    type: ActionTypes.ValidateAccount,
});

export const submit = <State>(
    getGaroonState: (baseState: State) => GaroonState,
): ThunkAction<
    void,
    State,
    void,
    ValidateAccountAction | StartVerifyAccountAction | EndVerifyAccountAction | NextAction
> => {
    return (
        dispatch: ThunkDispatch<
            State,
            void,
            ValidateAccountAction | StartVerifyAccountAction | EndVerifyAccountAction | NextAction
        >,
        getState: () => State,
    ) => {
        // バリデート→Mainプロセスに問い合わせ→handleNext
        dispatch(validate());
        const state = getGaroonState(getState());
        const serverUrl = state.serverUrl;
        const username = state.username;
        const password = state.password;
        if (!serverUrl.errorText && !username.errorText && !password.errorText) {
            dispatch(startVerify());
            const garoonAccount: GaroonAccount = {
                serverUrl: serverUrl.value,
                username: username.value,
                password: password.value,
            };
            ipcRenderer.send(Constants.VerifyGaroonAccountSendChannel, garoonAccount);
            ipcRenderer.once(
                Constants.VerifyGaroonAccountResposeChannel,
                (event: Electron.Event, result: Constants.VerifyGaroonAccountResponseType): void => {
                    if (result) {
                        dispatch(endVerify(VerifyState.Verified, VerifyResult.Valid));
                        dispatch(next());
                    } else {
                        dispatch(endVerify(VerifyState.Verified, VerifyResult.Invalid));
                    }
                },
            );
        }
    };
};

export const setServerUrl: ActionCreator<SetServerUrlAction> = (serverUrl: string): SetServerUrlAction => ({
    type: ActionTypes.SetServerUrl,
    payload: serverUrl,
});

export const submitEventPageUrl = <State>(
    getGaroonState: (baseState: State) => GaroonState,
): ThunkAction<void, State, void, NextAction> => {
    return (dispatch: Dispatch<NextAction>, getState: () => State) => {
        const state = getGaroonState(getState());
        if (state.eventPageUrl.valid) {
            const eventPageUrl: url.URL = new url.URL(state.eventPageUrl.value);
            eventPageUrl.search = ""; // If URL has search, remove it.
            ipcRenderer.send(Constants.SetGaroonEventPageUrlSendChannel, url.format(eventPageUrl));
            dispatch(next());
        }
    };
};

export const setUsername: ActionCreator<SetUsernameAction> = (username: string): SetUsernameAction => ({
    type: ActionTypes.SetUsername,
    payload: username,
});

export const setPassword: ActionCreator<SetPasswordAction> = (password: string): SetPasswordAction => ({
    type: ActionTypes.SetPassword,
    payload: password,
});

export const setEventPageUrl: ActionCreator<SetEventPageUrlAction> = (eventPageUrl: string): SetEventPageUrlAction => ({
    type: ActionTypes.SetEventPageUrl,
    payload: eventPageUrl,
});

/**
 * State
 */
interface Verifying {
    readonly state: VerifyState;
    readonly result: VerifyResult;
}

export const enum VerifyState {
    Initial,
    Verifying,
    Verified, // verify is end. See result whether verifying is success or not.
}

export const enum VerifyResult {
    Unknown, // initial state
    Valid, // Account is valid.
    Invalid, // Account is invalid.
    Error, // something wrong happen.
}

export interface GaroonState {
    readonly verifying: Verifying;
    readonly serverUrl: { value: string; errorText?: string };
    readonly username: { value: string; errorText?: string };
    readonly password: { value: string; errorText?: string };
    readonly eventPageUrl: { value: string; valid: boolean };
}

const initialState: GaroonState = {
    verifying: { state: VerifyState.Initial, result: VerifyResult.Unknown },
    serverUrl: { value: "" },
    username: { value: "" },
    password: { value: "" },
    eventPageUrl: { value: "", valid: false },
};

const isValieEventPageUrl = (eventPageUrl: string): boolean => {
    try {
        url.parse(eventPageUrl);
        return true;
    } catch (error) {
        if (error instanceof URIError) {
            return false;
        } else {
            throw new Error(`Invalid argument "${eventPageUrl}"`);
        }
    }
};

/**
 * Reducer
 */
const reducer: Reducer<GaroonState, GaroonActions> = (
    state: GaroonState = initialState,
    action: GaroonActions,
): GaroonState => {
    switch (action.type) {
        case ActionTypes.StartVerifyAccount:
            return { ...state, verifying: { ...state.verifying, state: VerifyState.Verifying } };
        case ActionTypes.EndVerifyAccount:
            return {
                ...state,
                verifying: { ...state.verifying, state: action.payload.state, result: action.payload.result },
            };
        case ActionTypes.ValidateAccount:
            return {
                ...state,
                serverUrl: {
                    ...state.serverUrl,
                    errorText: state.serverUrl.value.length === 0 ? "入力されていません" : undefined,
                },
                username: {
                    ...state.username,
                    errorText: state.username.value.length === 0 ? "入力されていません" : undefined,
                },
                password: {
                    ...state.password,
                    errorText: state.password.value.length === 0 ? "入力されていません" : undefined,
                },
            };
        case ActionTypes.SetServerUrl:
            return { ...state, serverUrl: { ...state.serverUrl, value: action.payload } };
        case ActionTypes.SetUsername:
            return { ...state, username: { ...state.username, value: action.payload } };
        case ActionTypes.SetPassword:
            return { ...state, password: { ...state.password, value: action.payload } };
        case ActionTypes.SetEventPageUrl:
            return {
                ...state,
                eventPageUrl: {
                    ...state.eventPageUrl,
                    value: action.payload,
                    valid: isValieEventPageUrl(action.payload),
                },
            };
        default:
            return state;
    }
};

export default reducer;
