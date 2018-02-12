import {ipcRenderer} from "electron";
import * as React from "react";
import { render } from "react-dom";
import { createStore, applyMiddleware, Store } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import MuiThemeProvider from "material-ui/styles/MuiThemeProvider";
import App from "./containers/tutorial/app";
import reducer, { TutorialState } from "./modules/tutorial";
import {setServerUrl, setEventPageUrl} from "./modules/garoon";
import * as Constants from "../common/constants";

const store: Store<TutorialState> = createStore(reducer, applyMiddleware(thunk));

// Receive initial data for state from main process.
ipcRenderer.send(Constants.SetInitialDataSendChannel);
ipcRenderer.once(Constants.SetInitialDataResponseChannel, (event: Electron.Event, initialData: Constants.SetInitialDataResponseType) => {
    if (initialData.garoonUrl) {
        store.dispatch(setServerUrl(initialData.garoonUrl));
    }
    if (initialData.garoonEventPageUrl) {
        store.dispatch(setEventPageUrl(initialData.garoonEventPageUrl));
    }
});

render(
    <Provider store={store}>
        <MuiThemeProvider>
            <App/>
        </MuiThemeProvider>
    </Provider>,
    document.getElementById("root")
);
