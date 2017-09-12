import * as packager from "electron-packager";
import rebuild from "electron-rebuild";
import {parse, ParsedPath} from "path";

// path starts with slash. like: "/README.md"
const needPaths: string[] = [
    "/package.json",
    "/dist",
    "/LICENSE",
    "/node_modules/garoon",
    "/node_modules/electron-store",
    "/node_modules/googleapis",
    "/node_modules/keytar",
    "/node_modules/cookie" // garoon require cookie, but garoon-sync also required.
];
const config: {version: string} = require("../../package.json");

export const ignores: packager.ignoreFunction = (path: string): boolean => {
    const paths: ParsedPath = parse(path);
    if (paths.base === ".DS_Store" || paths.ext === ".o" || paths.ext === ".ts" || paths.ext === ".md") {
        return true;
    }

    return path.length > 0 && path !== "/node_modules" && needPaths.every(needPath => path.indexOf(needPath) !== 0);
}

const opts: packager.Options = {
    dir: "./",
    out: "./release",
    name: "Garoon-Sync",
    platform: "darwin",
    arch: "x64",
    osxSign: true,
    asar: true,
    appVersion: config.version,
    icon: "./resources/darwin/garoon-sync.icns",
    appBundleId: "net.mtgto.garoonsync",
    overwrite: true,
    prune: false,
    ignore: ignores,
    afterCopy: [(buildPath: string, electronVersion: string, platform: string, arch: string, callback: (err?: any) => void) => {
        rebuild({buildPath, electronVersion, arch})
            .then(() => callback())
            .catch((error) => callback(error));
    }]
};

packager(opts, (err, appPaths) => {
    if (err) {
        throw err;
    }
    console.log(`Package generated at "${appPaths}".`);
});
