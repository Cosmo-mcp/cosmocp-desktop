import {namedHookWithTaskFn, PluginBase} from '@electron-forge/plugin-base';
import type {
    ForgeListrTask,
    ForgeMultiHookMap,
    ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import path from "path";
import fs from "fs";

export default class NextRendererPlugin extends PluginBase<void> {
    name: "Next Renderer";

    getHooks = (): ForgeMultiHookMap => {
        return {
            prePackage: [
                namedHookWithTaskFn<'prePackage'>(async (task) => {
                    const dest = path.resolve(__dirname, '../.vite/renderer/main_window');
                    const src = path.resolve(__dirname, './renderer/out');
                    if (!fs.existsSync(dest)) {
                        fs.mkdirSync(dest, {recursive: true});
                    }
                    console.log("Hello: " + src);
                    fs.cpSync(src, dest, {recursive: true});

                },"Copy Next Bundle"),
            ]
        }
    }
}