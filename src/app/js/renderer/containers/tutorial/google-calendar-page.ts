import { connect, MapDispatchToProps, MapStateToProps } from "react-redux";
import { Dispatch } from "redux";
import GoogleCalendarPage, {
    ConnectedDispatchProps,
    ConnectedState,
} from "../../components/tutorial/google-calendar-page";
import { loadWritableCalendars, selectCalendar, SelectCalendarAction } from "../../modules/google-calendar";
import { next, NextAction, prev, PrevAction, TutorialState } from "../../modules/tutorial";

const mapStateToProps: MapStateToProps<ConnectedState, {}, TutorialState> = (state: TutorialState): ConnectedState => ({
    googleCalendar: state.googleCalendar,
});

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, {}> = (
    dispatch: Dispatch<SelectCalendarAction | NextAction | PrevAction>,
) => ({
    selectCalendar: (calendarId: string) => dispatch(selectCalendar(calendarId)),
    reload: () => dispatch(loadWritableCalendars((state: TutorialState) => state.googleCalendar) as any),
    handlePrev: () => dispatch(prev()),
    submit: () => dispatch(next()),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(GoogleCalendarPage);
