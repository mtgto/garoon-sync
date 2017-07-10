import { connect } from "react-redux";
import { Dispatch } from "redux";
import { GaroonState, GaroonActions } from "../../modules/garoon";
import * as Tutorial from "../../modules/tutorial";
import App from "../../components/tutorial/app";

export default connect(
    (state: Tutorial.TutorialState) => ({ stepIndex: state.tutorial.stepIndex })
)(App);
