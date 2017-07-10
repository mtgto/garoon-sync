import { connect } from "react-redux";
import { Dispatch } from "redux";
import { GaroonState, GaroonActions } from "../../modules/garoon";
import * as Tutorial from "../../modules/tutorial";
import FirstPage, {Props as FirstPageProps} from "../../components/tutorial/first-page";

/**
 * @todo mapDispatchToPropsの型定義
 */
export default connect(
    undefined,
    (dispatch: Dispatch<Tutorial.TutorialState>) => ({handleNext: () => dispatch(Tutorial.next())} as FirstPageProps)
)(FirstPage);
