import * as CopyWebpackPlugin from "copy-webpack-plugin";
import * as HtmlWebpackPlugin from "html-webpack-plugin";
import * as path from "path";
import * as webpack from "webpack";

/**
 * For Electron renderer process scripts
 */
export const renderConfig: webpack.Configuration = {
    entry: {
        tutorial: "./src/app/js/renderer/tutorial.tsx",
    },
    output: {
        path: path.resolve(__dirname, "dist/app/js/renderer"),
        filename: "[name].js",
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    target: "electron-renderer",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/tutorial.html",
            filename: path.resolve(__dirname, "dist/app/tutorial.html"),
        }),
    ],
};

/**
 * For Electron main process scripts
 */
export const mainConfig: webpack.Configuration = {
    entry: "./src/app/js/main/index.ts",
    output: {
        path: path.resolve(__dirname, "dist/app"),
        filename: "js/main/index.js",
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    target: "electron-main",
    node: {
        __dirname: false,
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: "ts-loader",
            },
            {
                test: /\.node$/,
                use: "node-loader",
            },
        ],
    },
    plugins: [
        new webpack.EnvironmentPlugin([
            "GOOGLE_CLIENT_ID", // Embed client id from environment variables
            "GOOGLE_CLIENT_SECRET", // Embed client secret from environment variables
            "GAROON_URL", // Embed default garoon url from environment variables
            "GAROON_EVENT_PAGE_URL", // Embed garoon event page url from environment variables
        ]),
        new CopyWebpackPlugin([
            {
                from: "src/app/image",
                to: "image",
            },
        ]),
    ],
    externals: {
        googleapis: "commonjs googleapis",
        "electron-store": "commonjs electron-store",
        garoon: "commonjs garoon",
        keytar: "commonjs keytar",
    },
};
