import {contextBridge} from 'electron';
import {api} from './api';
import log from 'electron-log/renderer';

contextBridge.exposeInMainWorld('api', api);

log.info('Preload script loaded and API exposed!');