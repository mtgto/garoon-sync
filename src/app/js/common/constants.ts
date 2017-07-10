/**
 * Constants referred by both main and renderer processes.
 */
import {Calendar, CalendarId} from "./google";

// Event channel names
export const SetInitialDataSendChannel: string = "SET_INITIAL_DATA_SEND";
export const SetInitialDataResponseChannel: string = "SET_INITIAL_DATA_RESPONSE";
export type SetInitialDataResponseType = {garoonUrl?: string, garoonEventPageUrl?: string};

export const VerifyGaroonAccountSendChannel: string = "VERIFY_GAROON_ACCOUNT_SEND";
export const VerifyGaroonAccountResposeChannel: string = "VERIFY_GAROON_ACCOUNT_RESPONSE";
export type VerifyGaroonAccountResponseType = boolean;

export const SetGaroonEventPageUrlSendChannel: string = "SET_GAROON_EVENT_PAGE_URL_SEND";
export type SetGaroonEventPageUrlSendType = string;

export const OpenGoogleCalendarAuthorizationViewSendChannel: string = "OPEN_GOOGLE_CALENDAR_AUTHORIZATION_VIEW_SEND";

export const VerifyGoogleCalendarAuthorizationCodeSendChannel: string = "VERIFY_GOOGLE_CALENDAR_AUTHORIZATION_CODE_SEND";
export const VerifyGoogleCalendarAuthorizationCodeResponseChannel: string = "VERIFY_GOOGLE_CALENDAR_AUTHORIZATION_CODE_RESPONSE";
export type VerifyGoogleCalendarAuthorizationCodeResponseType = boolean;

export const GetWritableGoogleCalendarsSendChannel: string = "GET_WRITABLE_GOOGLE_CALENDARS_SEND";
export const GetWritableGoogleCalendarsResponseChannel: string = "GET_WRITABLE_GOOGLE_CALENDARS_RESPONSE";
export type GetWritableGoogleCalendarsResponseType = Calendar[] | undefined;

export const FinishTutorialSendChannel: string = "FINISH_TUTORIAL_SEND_CHANNEL";
export type FinishTutorialSendType1 = CalendarId;
export type FinishTutorialSendType2 = boolean; // whether start sync or not.
