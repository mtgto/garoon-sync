import { connect } from "react-redux";
import { Dispatch } from "redux";
import * as Garoon from "../../modules/garoon";
import * as Tutorial from "../../modules/tutorial";
import GaroonPage, {ConnectedDispatchProps, ConnectedState} from "../../components/tutorial/garoon-page";

/**
 * @todo mapDispatchToPropsの型定義
 */
export default connect(
    (state: Tutorial.TutorialState) => ({garoon: state.garoon} as ConnectedState),
    (dispatch: Dispatch<Tutorial.TutorialState>) => (
        {
            submit: () => dispatch(Garoon.submit((state: Tutorial.TutorialState) => state.garoon)),
            handlePrev: () => dispatch(Tutorial.prev()),
            setServerUrl: (serverUrl: string) => dispatch(Garoon.setServerUrl(serverUrl)),
            setUsername: (username: string) => dispatch(Garoon.setUsername(username)),
            setPassword: (password: string) => dispatch(Garoon.setPassword(password)),
        } as ConnectedDispatchProps)
)(GaroonPage);
