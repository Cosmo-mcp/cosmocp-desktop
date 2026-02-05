import log from "electron-log/main";
import os from "os";
import path from "path";
import {app} from "electron";

log.initialize();

function resolveLogDir(): string {
    try {
        if (app && typeof app.getPath === "function") {
            return path.join(app.getPath("userData"), "logs");
        }
    } catch {
        // Ignore: this file can be imported by non-Electron tooling (e.g. API generator scripts).
    }

    return path.join(os.tmpdir(), "cosmo-studio-logs");
}

const logDir = resolveLogDir();

log.transports.file.level = 'info';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
log.transports.file.resolvePathFn = () => path.join(logDir, "cosmo.log");

export const logger = log.scope("main");
