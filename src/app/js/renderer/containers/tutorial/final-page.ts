import { connect } from "react-redux";
import { Dispatch } from "redux";
import * as Tutorial from "../../modules/tutorial";
import FinalPage, {ConnectedDispatchProps, ConnectedState} from "../../components/tutorial/final-page";

/**
 * @todo mapDispatchToPropsの型定義
 */
export default connect(
    (state: Tutorial.TutorialState) => ({startSyncAfterTutorial: state.tutorial.startSyncAfterTutorial} as ConnectedState),
    (dispatch: Dispatch<Tutorial.TutorialState>) => (
        {
            setStartSyncAfterTutorial: (event: any, isInputChecked: boolean) => dispatch(Tutorial.setStartSyncAfterTutorial(isInputChecked)),
            submit: () => dispatch(Tutorial.submit())
        } as ConnectedDispatchProps)
)(FinalPage);
