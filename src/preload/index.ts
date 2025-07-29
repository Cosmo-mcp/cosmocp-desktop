import { contextBridge } from 'electron';
import { chatAPI } from './api';

contextBridge.exposeInMainWorld('chatAPI', chatAPI);

console.log('Preload script loaded and API exposed!');