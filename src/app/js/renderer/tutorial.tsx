import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import { ipcRenderer } from "electron";
import * as React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { applyMiddleware, createStore, Store } from "redux";
import thunk from "redux-thunk";
import * as Constants from "../common/constants";
import App from "./containers/tutorial/app";
import { setEventPageUrl, setServerUrl } from "./modules/garoon";
import reducer, { TutorialState } from "./modules/tutorial";

const store: Store<TutorialState> = createStore(reducer, applyMiddleware(thunk));

// Receive initial data for state from main process.
ipcRenderer.send(Constants.SetInitialDataSendChannel);
ipcRenderer.once(
    Constants.SetInitialDataResponseChannel,
    (event: Electron.Event, initialData: Constants.SetInitialDataResponseType) => {
        if (initialData.garoonUrl) {
            store.dispatch(setServerUrl(initialData.garoonUrl));
        }
        if (initialData.garoonEventPageUrl) {
            store.dispatch(setEventPageUrl(initialData.garoonEventPageUrl));
        }
    },
);

const theme = createMuiTheme({
    typography: {
        fontFamily: ["Roboto", "'Noto Sans JP'", "Helvetica", "Arial", "sans-serif"].join(","),
    },
});

render(
    <Provider store={store}>
        <MuiThemeProvider theme={theme}>
            <App />
        </MuiThemeProvider>
    </Provider>,
    document.getElementById("root"),
);
