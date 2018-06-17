import * as webpack from "webpack";
import * as merge from "webpack-merge";
import {renderConfig, mainConfig} from "./webpack.common";
const UglifyPlugin = require("uglifyjs-webpack-plugin");

export default [
    merge(renderConfig, {
        mode: "production",
        optimization: {
            minimizer: [
                new UglifyPlugin()
            ]
        }
    }),
    merge(mainConfig, {
        mode: "production",
        optimization: {
            minimizer: [
                new UglifyPlugin()
            ]
        }
    })
];
