import { connect } from "react-redux";
import { Dispatch } from "redux";
import * as Garoon from "../../modules/garoon";
import * as Tutorial from "../../modules/tutorial";
import GaroonEventPage, {ConnectedDispatchProps, ConnectedState} from "../../components/tutorial/garoon-event-page";

/**
 * @todo mapDispatchToPropsの型定義
 */
export default connect(
    (state: Tutorial.TutorialState) => ({garoon: state.garoon} as ConnectedState),
    (dispatch: Dispatch<Tutorial.TutorialState>) => (
        {
            submit: () => dispatch(Garoon.submitEventPageUrl((state: Tutorial.TutorialState) => state.garoon)),
            handlePrev: () => dispatch(Tutorial.prev()),
            setEventPageUrl: (eventPageUrl: string) => dispatch(Garoon.setEventPageUrl(eventPageUrl))
        } as ConnectedDispatchProps)
)(GaroonEventPage);
