import type {ForgeConfig} from '@electron-forge/shared-types';
import {MakerSquirrel} from '@electron-forge/maker-squirrel';
import {MakerZIP} from '@electron-forge/maker-zip';
import {MakerDeb} from '@electron-forge/maker-deb';
import {MakerRpm} from '@electron-forge/maker-rpm';
import {VitePlugin} from '@electron-forge/plugin-vite';
import {FusesPlugin} from '@electron-forge/plugin-fuses';
import {FuseV1Options, FuseVersion} from '@electron/fuses';
import NextRendererPlugin from "./src/NextRendererPlugin";

const config: ForgeConfig = {
        packagerConfig: {
            name: "Cosmo MCP",
            asar: true,
        },
        rebuildConfig: {},
        makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],

        plugins: [
            new VitePlugin({
                // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
                // If you are familiar with Vite configuration, it will look really familiar.
                build: [
                    {
                        // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
                        entry: 'src/main/index.ts',
                        config: 'vite.main.config.ts',
                        target: 'main',
                    },
                    {
                        entry: 'src/preload/index.ts',
                        config: 'vite.preload.config.ts',
                        target: 'preload',
                    },
                ],
                renderer: [], // Empty renderer part because we build next.js
            }),
            //this plugin copies files already build next.js frontend app
            //next.js frontend app is build part of `make/package` script
            new NextRendererPlugin(),
            // Fuses are used to enable/disable various Electron functionality
            // at package time, before code signing the application
            new FusesPlugin({
                version: FuseVersion.V1,
                [FuseV1Options.RunAsNode]: false,
                [FuseV1Options.EnableCookieEncryption]: true,
                [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
                [FuseV1Options.EnableNodeCliInspectArguments]: false,
                [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
                [FuseV1Options.OnlyLoadAppFromAsar]: true,
            }),
        ],
    }
;

export default config;
