import { connect } from "react-redux";
import { Dispatch } from "redux";
import * as GoogleCalendar from "../../modules/google-calendar";
import * as Tutorial from "../../modules/tutorial";
import GoogleAuthPage, {ConnectedDispatchProps, ConnectedState} from "../../components/tutorial/google-auth-page";

/**
 * @todo mapDispatchToPropsの型定義
 */
export default connect(
    (state: Tutorial.TutorialState) => ({googleCalendar: state.googleCalendar} as ConnectedState),
    (dispatch: Dispatch<Tutorial.TutorialState>) => (
        {
            openAuthorizationView: () => dispatch(GoogleCalendar.openAuthorizationView()),
            submit: () => dispatch(GoogleCalendar.submit((state: Tutorial.TutorialState) => state.googleCalendar)),
            handlePrev: () => dispatch(Tutorial.prev()),
            setAuthorizationCode: (code: string) => dispatch(GoogleCalendar.setAuthorizationCode(code))
        } as ConnectedDispatchProps)
)(GoogleAuthPage);
