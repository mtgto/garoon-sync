import { connect, MapDispatchToProps, MapStateToProps } from "react-redux";
import { Dispatch } from "redux";
import GaroonEventPage, { ConnectedDispatchProps, ConnectedState } from "../../components/tutorial/garoon-event-page";
import { setEventPageUrl, SetEventPageUrlAction, submitEventPageUrl } from "../../modules/garoon";
import { prev, PrevAction, TutorialState } from "../../modules/tutorial";

const mapStateToProps: MapStateToProps<ConnectedState, {}, TutorialState> = (state: TutorialState): ConnectedState => ({
    garoon: state.garoon,
});

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, {}> = (
    dispatch: Dispatch<PrevAction | SetEventPageUrlAction>,
) => ({
    handlePrev: () => dispatch(prev()),
    setEventPageUrl: (eventPageUrl: string) => dispatch(setEventPageUrl(eventPageUrl)),
    submit: () => dispatch(submitEventPageUrl((state: TutorialState) => state.garoon) as any),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(GaroonEventPage);
