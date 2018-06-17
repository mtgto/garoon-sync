import { connect } from "react-redux";
import App from "../../components/tutorial/app";
import * as Tutorial from "../../modules/tutorial";

export default connect((state: Tutorial.TutorialState) => ({
    stepIndex: state.tutorial.stepIndex,
}))(App);
