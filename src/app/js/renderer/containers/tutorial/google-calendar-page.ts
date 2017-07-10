import { connect } from "react-redux";
import { Dispatch } from "redux";
import * as GoogleCalendar from "../../modules/google-calendar";
import * as Tutorial from "../../modules/tutorial";
import GoogleCalendarPage, {ConnectedDispatchProps, ConnectedState} from "../../components/tutorial/google-calendar-page";

/**
 * @todo mapDispatchToPropsの型定義
 */
export default connect(
    (state: Tutorial.TutorialState) => ({googleCalendar: state.googleCalendar} as ConnectedState),
    (dispatch: Dispatch<Tutorial.TutorialState>) => (
        {
            selectCalendar: (event: any, index: number, menuItemValue: string) => dispatch(GoogleCalendar.selectCalendar(event, index, menuItemValue)),
            reload: () => dispatch(GoogleCalendar.loadWritableCalendars((state: Tutorial.TutorialState) => state.googleCalendar)),
            handlePrev: () => dispatch(Tutorial.prev()),
            submit: () => dispatch(Tutorial.next())
        } as ConnectedDispatchProps)
)(GoogleCalendarPage);
