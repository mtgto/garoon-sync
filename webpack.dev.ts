import * as merge from "webpack-merge";
import {renderConfig, mainConfig} from "./webpack.common";

export default [
    merge(renderConfig, {
        mode: "development",
        devtool: "inline-source-map"
    }),
    merge(mainConfig, {
        mode: "development",
        devtool: "inline-source-map"
    })
];
