import * as React from "react";
import FinalPage from "../../containers/tutorial/final-page";
import FirstPage from "../../containers/tutorial/first-page";
import GaroonEventPage from "../../containers/tutorial/garoon-event-page";
import GaroonPage from "../../containers/tutorial/garoon-page";
import GoogleAuthPage from "../../containers/tutorial/google-auth-page";
import GoogleCalendarPage from "../../containers/tutorial/google-calendar-page";

export interface Props {
    stepIndex: number;
}

const App: React.StatelessComponent<Props> = (props: Props) => {
    switch (props.stepIndex) {
        case 0:
            return <FirstPage />;
        case 1:
            return <GaroonPage />;
        case 2:
            return <GaroonEventPage />;
        case 3:
            return <GoogleAuthPage />;
        case 4:
            return <GoogleCalendarPage />;
        default:
            return <FinalPage />;
    }
};

export default App;
