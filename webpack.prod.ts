import * as webpack from "webpack";
import * as merge from "webpack-merge";
import {renderConfig, mainConfig} from "./webpack.common";

export default [
    merge(renderConfig, {
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            }),
        ]
    }),
    merge(mainConfig, {
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            }),
        ]
    })
];
