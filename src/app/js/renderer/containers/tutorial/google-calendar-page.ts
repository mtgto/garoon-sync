import { connect, MapStateToProps, MapDispatchToProps } from "react-redux";
import { Dispatch } from "redux";
import * as GoogleCalendar from "../../modules/google-calendar";
import * as Tutorial from "../../modules/tutorial";
import GoogleCalendarPage, {ConnectedDispatchProps, ConnectedState} from "../../components/tutorial/google-calendar-page";

const mapStateToProps: MapStateToProps<ConnectedState, void, Tutorial.TutorialState> = (state: Tutorial.TutorialState): ConnectedState => ({
    googleCalendar: state.googleCalendar
});

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, void> = (dispatch: Dispatch<any>) => ({
    selectCalendar: (event: any, index: number, menuItemValue: string) => dispatch(GoogleCalendar.selectCalendar(event, index, menuItemValue)),
    reload: () => dispatch(GoogleCalendar.loadWritableCalendars((state: Tutorial.TutorialState) => state.googleCalendar)),
    handlePrev: () => dispatch(Tutorial.prev()),
    submit: () => dispatch(Tutorial.next())
});

export default connect(mapStateToProps, mapDispatchToProps)(GoogleCalendarPage);
