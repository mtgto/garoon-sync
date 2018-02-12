import { connect, MapStateToProps, MapDispatchToProps } from "react-redux";
import { Dispatch } from "redux";
import * as GoogleCalendar from "../../modules/google-calendar";
import * as Tutorial from "../../modules/tutorial";
import GoogleAuthPage, {ConnectedDispatchProps, ConnectedState} from "../../components/tutorial/google-auth-page";

const mapStateToProps: MapStateToProps<ConnectedState, void, Tutorial.TutorialState> = (state: Tutorial.TutorialState): ConnectedState => ({
    googleCalendar: state.googleCalendar
});

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, void> = (dispatch: Dispatch<any>) => ({
    openAuthorizationView: () => dispatch(GoogleCalendar.openAuthorizationView()),
    submit: () => dispatch(GoogleCalendar.submit((state: Tutorial.TutorialState) => state.googleCalendar)),
    handlePrev: () => dispatch(Tutorial.prev()),
    setAuthorizationCode: (code: string) => dispatch(GoogleCalendar.setAuthorizationCode(code))
});

/**
 * @todo mapDispatchToPropsの型定義
 */
export default connect(mapStateToProps, mapDispatchToProps)(GoogleAuthPage);
