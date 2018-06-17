import { connect, MapDispatchToProps, MapStateToProps } from "react-redux";
import { Dispatch } from "redux";
import GoogleAuthPage, { ConnectedDispatchProps, ConnectedState } from "../../components/tutorial/google-auth-page";
import {
    openAuthorizationView,
    OpenAuthorizationViewAction,
    setAuthorizationCode,
    SetAuthorizationCodeAction,
    submit,
} from "../../modules/google-calendar";
import { prev, PrevAction, TutorialState } from "../../modules/tutorial";

const mapStateToProps: MapStateToProps<ConnectedState, {}, TutorialState> = (state: TutorialState): ConnectedState => ({
    googleCalendar: state.googleCalendar,
});

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, {}> = (
    dispatch: Dispatch<PrevAction | SetAuthorizationCodeAction>,
) => ({
    openAuthorizationView: () => dispatch(openAuthorizationView() as any),
    submit: () => dispatch(submit((state: TutorialState) => state.googleCalendar) as any),
    handlePrev: () => dispatch(prev()),
    setAuthorizationCode: (code: string) => dispatch(setAuthorizationCode(code)),
});

/**
 * @todo mapDispatchToPropsの型定義
 */
export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(GoogleAuthPage);
