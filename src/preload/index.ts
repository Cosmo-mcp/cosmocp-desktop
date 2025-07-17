import { contextBridge } from 'electron';
import { electronAPI } from './api';

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('Preload script loaded and API exposed!');