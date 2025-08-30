import {app, BrowserWindow} from 'electron';
import path from 'path';
import {registerIpcHandlers} from './ipc';


// These global constants ARE provided by Electron Forge's Vite plugin.
// Even if we're "ignoring Vite", these are essential for the template's runtime behavior.
//declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
//declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null;
//const isDev = process.env.NODE_ENV === 'development';
const isDev = false;

async function createWindow(): Promise<void> {
    mainWindow = new BrowserWindow({
        height: 600,
        width: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            // Adjusting preload path relative to the *built* main process file's location.
            // If main is in .vite/main/ and preload is in .vite/preload/,
            // then from .vite/main/, we go '../preload/index.js'
            preload: path.join(__dirname, '../preload/index.js'),
        },
    });

    mainWindow.setMenuBarVisibility(false);

   /* if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        // In development, load from Vite's dev server
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        // In production, load the built HTML file from the Vite output directory.
        // From .vite/build/, we need to go up one level, then into renderer/, then into the named directory.
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }*/

    if (isDev) {
        //react local url
        mainWindow.loadURL('http://localhost:3000');
    } else {
        // In production, load the built HTML file from the Vite output directory.
        // From .vite/build/, we need to go up one level, then into renderer/, then into the named directory.
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
    mainWindow.webContents.openDevTools();
    mainWindow.maximize();
}

app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});