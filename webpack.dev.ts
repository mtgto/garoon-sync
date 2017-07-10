import * as merge from "webpack-merge";
import {renderConfig, mainConfig} from "./webpack.common";

export default [
    merge(renderConfig, {
        devtool: "inline-source-map"
    }),
    merge(mainConfig, {
        devtool: "inline-source-map"
    })
];
