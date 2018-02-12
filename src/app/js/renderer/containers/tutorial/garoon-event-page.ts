import { connect, MapStateToProps, MapDispatchToProps } from "react-redux";
import { Dispatch } from "redux";
import * as Garoon from "../../modules/garoon";
import * as Tutorial from "../../modules/tutorial";
import GaroonEventPage, {ConnectedDispatchProps, ConnectedState} from "../../components/tutorial/garoon-event-page";

const mapStateToProps: MapStateToProps<ConnectedState, void, Tutorial.TutorialState> = (state: Tutorial.TutorialState): ConnectedState => ({
    garoon: state.garoon
});

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, void> = (dispatch: Dispatch<any>) => ({
    submit: () => dispatch(Garoon.submitEventPageUrl((state: Tutorial.TutorialState) => state.garoon)),
    handlePrev: () => dispatch(Tutorial.prev()),
    setEventPageUrl: (eventPageUrl: string) => dispatch(Garoon.setEventPageUrl(eventPageUrl))
});

export default connect(mapStateToProps, mapDispatchToProps)(GaroonEventPage);
