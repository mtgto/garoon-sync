import * as UglifyJsPlugin from "uglifyjs-webpack-plugin";
import * as merge from "webpack-merge";
import { mainConfig, renderConfig } from "./webpack.common";

export default [
    merge(renderConfig, {
        mode: "production",
        optimization: {
            minimizer: [new UglifyJsPlugin()],
        },
    }),
    merge(mainConfig, {
        mode: "production",
        optimization: {
            minimizer: [new UglifyJsPlugin()],
        },
    }),
];
