import log from "electron-log/main";
import path from "path";

log.initialize();

// Only configure file transport if running in Electron context
try {
    const {app} = require("electron");
    if (app && app.getPath) {
        const logDir = path.join(app.getPath("userData"), "logs");
        log.transports.file.level = 'info';
        log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
        log.transports.file.resolvePathFn = () => path.join(logDir, "cosmo.log");
    }
} catch (error) {
    // Not in Electron context, skip file transport configuration
}

export const logger = log.scope("main");