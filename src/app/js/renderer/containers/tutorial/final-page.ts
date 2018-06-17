import { connect, MapDispatchToProps, MapStateToProps } from "react-redux";
import { ActionCreator, Dispatch } from "redux";
import FinalPage, { ConnectedDispatchProps, ConnectedState } from "../../components/tutorial/final-page";
import {
    setStartSyncAfterTutorial,
    SetStartSyncAfterTutorialAction,
    submit,
    TutorialState,
} from "../../modules/tutorial";

const mapStateToProps: MapStateToProps<ConnectedState, {}, TutorialState> = (state: TutorialState): ConnectedState => ({
    startSyncAfterTutorial: state.tutorial.startSyncAfterTutorial,
});

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, {}> = (
    dispatch: Dispatch<SetStartSyncAfterTutorialAction /* | SubmitAction*/>,
) => ({
    setStartSyncAfterTutorial: (isInputChecked: boolean) => dispatch(setStartSyncAfterTutorial(isInputChecked)),
    submit: () => dispatch((submit as ActionCreator<any>)()),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(FinalPage);
