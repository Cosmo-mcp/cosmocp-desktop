import { ipcRenderer } from 'electron';

export interface ElectronAPI {
  getHelloMessage: (name: string) => Promise<string>;
}

export const electronAPI: ElectronAPI = {
  getHelloMessage: (name: string) => {
    return ipcRenderer.invoke('request-hello-message', name);
  },
};