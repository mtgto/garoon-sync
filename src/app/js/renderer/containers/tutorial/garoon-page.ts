import { connect, MapStateToProps, MapDispatchToProps } from "react-redux";
import { Dispatch } from "redux";
import * as Garoon from "../../modules/garoon";
import * as Tutorial from "../../modules/tutorial";
import GaroonPage, {ConnectedDispatchProps, ConnectedState} from "../../components/tutorial/garoon-page";

const mapStateToProps: MapStateToProps<ConnectedState, void, Tutorial.TutorialState> = (state: Tutorial.TutorialState): ConnectedState => ({
    garoon: state.garoon
});

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, void> = (dispatch: Dispatch<any>) => ({
    submit: () => dispatch(Garoon.submit((state: Tutorial.TutorialState) => state.garoon)),
    handlePrev: () => dispatch(Tutorial.prev()),
    setServerUrl: (serverUrl: string) => dispatch(Garoon.setServerUrl(serverUrl)),
    setUsername: (username: string) => dispatch(Garoon.setUsername(username)),
    setPassword: (password: string) => dispatch(Garoon.setPassword(password)),
});

export default connect(mapStateToProps, mapDispatchToProps)(GaroonPage);
