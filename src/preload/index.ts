import {contextBridge} from 'electron';
import {api} from './api';

contextBridge.exposeInMainWorld('api', api);

console.log('Preload script loaded and API exposed!');