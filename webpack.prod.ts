import * as webpack from "webpack";
import * as merge from "webpack-merge";
import {renderConfig, mainConfig} from "./webpack.common";
const UglifyPlugin = require("uglifyjs-webpack-plugin");

export default [
    merge(renderConfig, {
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            }),
            new UglifyPlugin()
        ]
    }),
    merge(mainConfig, {
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            }),
            new UglifyPlugin()
        ]
    })
];
