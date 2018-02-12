import { connect, MapDispatchToProps } from "react-redux";
import { Dispatch } from "redux";
import { GaroonState, GaroonActions } from "../../modules/garoon";
import * as Tutorial from "../../modules/tutorial";
import FirstPage, {ConnectedDispatchProps} from "../../components/tutorial/first-page";

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, void> = (dispatch: Dispatch<any>) => ({
    handleNext: () => dispatch(Tutorial.next())
});

/**
 * @todo mapDispatchToPropsの型定義
 */
export default connect(mapDispatchToProps)(FirstPage);
