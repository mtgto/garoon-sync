import * as merge from "webpack-merge";
import { mainConfig, renderConfig } from "./webpack.common";

export default [
    merge(renderConfig, {
        mode: "development",
        devtool: "inline-source-map",
    }),
    merge(mainConfig, {
        mode: "development",
        devtool: "inline-source-map",
    }),
];
