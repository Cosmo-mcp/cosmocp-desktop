import log from "electron-log/main";
import path from "path";
import {app} from "electron";

log.initialize();

//const logDir = path.join(app.getPath("userData"), "logs");

log.transports.file.level = 'info';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB
//log.transports.file.resolvePathFn = () => path.join(logDir, "cosmo.log");

export const logger = log.scope("main");