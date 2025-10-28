import {app, BrowserWindow} from 'electron';
import path from 'path';
import {IpcHandlerRegistry} from './ipc';
import {DatabaseManager} from "@database/DatabaseManager";
import 'reflect-metadata';
import container from "./inversify.config";
import {TYPES} from "./types";
import {config} from "dotenv";

export class Main {
    private mainWindow: BrowserWindow | null = null;
    private readonly isDev = process.env.NODE_ENV !== 'production';
    private readonly MAIN_WINDOW_VITE_DEV_SERVER_URL = this.isDev ? 'http://localhost:3000' : undefined;

    constructor() {
        config();
        app.whenReady().then(async () => {
            await this.initializeDatabase();
            const ipcHandlerRegistry = container.get<IpcHandlerRegistry>(TYPES.IpcHandlerRegistry);
            ipcHandlerRegistry.registerIpcHandlers();
            await this.createWindow();
            this.registerAppEvents();
        });
    }

    private async initializeDatabase(): Promise<void> {
        const dbFolderName = this.isDev ? process.env.DATABASE_NAME : "database";
        if (!dbFolderName) {
            console.error('FATAL ERROR: DATABASE_NAME environment variable is not set. Cannot initialize database.');
            app.quit();
            return;
        }

        try {
            const userDataPath = app.getPath('userData');
            const absoluteDbPath = path.join(userDataPath, dbFolderName);
            console.log("Database Dir:" + absoluteDbPath);
            await DatabaseManager.initialize(absoluteDbPath);
        } catch (error) {
            console.error('FATAL ERROR: Failed to initialize database connection.', error);
            app.quit(); // Stop execution if we cannot connect
        }
    }

    private async createWindow(): Promise<void> {
        this.mainWindow = new BrowserWindow({
            height: 600,
            width: 800,
            webPreferences: {
                contextIsolation: true,
                nodeIntegration: false,
                preload: path.join(__dirname, '../preload/index.js'),
            },
        });
        this.mainWindow.webContents.reloadIgnoringCache();

        this.mainWindow.setMenuBarVisibility(false);

        if (this.MAIN_WINDOW_VITE_DEV_SERVER_URL) {
            await this.mainWindow.loadURL(this.MAIN_WINDOW_VITE_DEV_SERVER_URL);
        } else {
            await this.mainWindow.loadFile(path.join(__dirname, `../renderer/main_window/index.html`));
        }
        if (this.isDev) {
            this.mainWindow.webContents.openDevTools();
            this.mainWindow.maximize();
        }

    }

    private registerAppEvents(): void {
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
    }
}

new Main();
