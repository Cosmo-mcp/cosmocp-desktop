import { ipcMain } from 'electron';

export function registerIpcHandlers(): void {
  ipcMain.handle('request-hello-message', async (_event, name: string) => {
    console.log(`Main process received 'request-hello-message' from renderer with name: ${name}`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate async work
    return `Hello, ${name}! This is a message from the Main Process.`;
  });
}