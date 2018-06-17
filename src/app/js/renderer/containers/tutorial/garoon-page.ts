import { connect, MapDispatchToProps, MapStateToProps } from "react-redux";
import { Dispatch } from "redux";
import GaroonPage, { ConnectedDispatchProps, ConnectedState } from "../../components/tutorial/garoon-page";
import {
    setPassword,
    SetPasswordAction,
    setServerUrl,
    SetServerUrlAction,
    setUsername,
    SetUsernameAction,
    submit,
} from "../../modules/garoon";
import { prev, PrevAction, TutorialState } from "../../modules/tutorial";

const mapStateToProps: MapStateToProps<ConnectedState, {}, TutorialState> = (state: TutorialState): ConnectedState => ({
    garoon: state.garoon,
});

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, {}> = (
    dispatch: Dispatch<SetServerUrlAction | SetUsernameAction | SetPasswordAction | PrevAction>,
) => ({
    submit: () => dispatch(submit((state: TutorialState) => state.garoon) as any),
    handlePrev: () => dispatch(prev()),
    setServerUrl: (serverUrl: string) => dispatch(setServerUrl(serverUrl)),
    setUsername: (username: string) => dispatch(setUsername(username)),
    setPassword: (password: string) => dispatch(setPassword(password)),
});

const ConnectedComponent = connect(
    mapStateToProps,
    mapDispatchToProps,
)(GaroonPage);

export default ConnectedComponent;
