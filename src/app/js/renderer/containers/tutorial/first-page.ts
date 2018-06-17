import { connect, MapDispatchToProps } from "react-redux";
import { Dispatch } from "redux";
import FirstPage, { ConnectedDispatchProps } from "../../components/tutorial/first-page";
import { next, NextAction } from "../../modules/tutorial";

const mapDispatchToProps: MapDispatchToProps<ConnectedDispatchProps, {}> = (dispatch: Dispatch<NextAction>) => ({
    handleNext: () => dispatch(next()),
});

export default connect(
    undefined,
    mapDispatchToProps,
)(FirstPage);
