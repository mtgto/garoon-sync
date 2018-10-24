import * as merge from "webpack-merge";
import { mainConfig, renderConfig } from "./webpack.common";

export default [
    merge(renderConfig, {
        mode: "production",
        optimization: {
            minimize: true,
        },
    }),
    merge(mainConfig, {
        mode: "production",
        optimization: {
            minimize: true,
        },
    }),
];
