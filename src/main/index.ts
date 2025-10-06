import {app, BrowserWindow} from 'electron';
import path from 'path';
import {registerIpcHandlers} from './ipc';
import {DatabaseManager} from "../core/database/DatabaseManager";
import 'reflect-metadata';


// These global constants ARE provided by Electron Forge's Vite plugin.
// Even if we're "ignoring Vite", these are essential for the template's runtime behavior.
//declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null;
const isDev = process.env.NODE_ENV === 'development';
const MAIN_WINDOW_VITE_DEV_SERVER_URL = isDev ? 'http://localhost:3000' : undefined;

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

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        // In development, load from Next dev server
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        // In production, load the built HTML file from the Next out directory.
        // From .vite/build/, we need to go up one level, then into renderer/, then into the named directory.
        mainWindow.loadFile(path.join(__dirname, `../renderer/main_window/index.html`));
    }
    mainWindow.webContents.openDevTools();
    mainWindow.maximize();
}

app.whenReady().then(async () => {
    const dbFolderName = process.env.DATABASE_NAME;
    if (!dbFolderName) {
        console.error('FATAL ERROR: DATABASE_NAME environment variable is not set. Cannot initialize database.');
        app.quit();
        return;
    }

    try {
        const userDataPath = app.getPath('userData');
        const absoluteDbPath = path.join(userDataPath, dbFolderName);
        await DatabaseManager.initialize(absoluteDbPath);
    } catch (error) {
        console.error('FATAL ERROR: Failed to initialize database connection.', error);
        app.quit(); // Stop execution if we cannot connect
        return;
    }

    registerIpcHandlers();
    await createWindow();

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
