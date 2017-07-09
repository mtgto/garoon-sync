import * as webpack from "webpack";
import * as path from "path";

const config: webpack.Configuration = {
    entry: "./src/app/js/renderer/app.tsx",
    output: {
        path: path.resolve(__dirname, 'dist/app/js/renderer'),
        filename: "app.js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: "ts-loader",
        } as webpack.NewUseRule]
    }
};

export default config;
