import { connect, MapStateToProps, MapDispatchToProps } from "react-redux";
import { Dispatch } from "redux";
import * as Tutorial from "../../modules/tutorial";
import FinalPage, {ConnectedDispatchProps, ConnectedState} from "../../components/tutorial/final-page";

const mapStateToProps: MapStateToProps<ConnectedState, void, Tutorial.TutorialState> = (state: Tutorial.TutorialState): ConnectedState => ({
    startSyncAfterTutorial: state.tutorial.startSyncAfterTutorial
});

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, void> = (dispatch: Dispatch<any>) => ({
    setStartSyncAfterTutorial: (event: any, isInputChecked: boolean) => dispatch(Tutorial.setStartSyncAfterTutorial(isInputChecked)),
    submit: () => dispatch(Tutorial.submit())
});

export default connect(mapStateToProps, mapDispatchToProps)(FinalPage);
