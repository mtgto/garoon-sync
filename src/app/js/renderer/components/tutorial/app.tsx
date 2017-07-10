import * as React from "react";
import RaisedButton from "material-ui/RaisedButton";
import {TouchTapEventHandler} from "material-ui";
import FirstPage from "../../containers/tutorial/first-page";
import GaroonPage from "../../containers/tutorial/garoon-page";
import GaroonEventPage from "../../containers/tutorial/garoon-event-page";
import GoogleAuthPage from "../../containers/tutorial/google-auth-page";
import GoogleCalendarPage from "../../containers/tutorial/google-calendar-page";
import FinalPage from "../../containers/tutorial/final-page";

export interface Props {
    stepIndex: number
};

const App: React.StatelessComponent<Props> = (props: Props) => {
    switch (props.stepIndex) {
        case 0:
            return <FirstPage/>;
        case 1:
            return <GaroonPage/>;
        case 2:
            return <GaroonEventPage/>;
        case 3:
            return <GoogleAuthPage/>;
        case 4:
            return <GoogleCalendarPage/>;
        default:
            return <FinalPage/>;
    };
}

export default App;
