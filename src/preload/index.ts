import { contextBridge } from 'electron';
import {chatAPI, modelProviderAPI} from './api';

contextBridge.exposeInMainWorld('chatAPI', chatAPI);
contextBridge.exposeInMainWorld('modelProviderAPI', modelProviderAPI);

console.log('Preload script loaded and API exposed!');