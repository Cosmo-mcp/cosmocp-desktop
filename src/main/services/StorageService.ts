import {app} from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export class StorageService<T> {
    private readonly filePath: string;

    constructor(fileName: string) {
        const userDataPath = app.getPath('userData');
        this.filePath = path.join(userDataPath, fileName);
    }

    async get(): Promise<T | null> {
        try {
            const data = await fs.promises.readFile(this.filePath, 'utf-8');
            return JSON.parse(data) as T;
        } catch (error) {
            return null;
        }
    }

    async set(data: T): Promise<void> {
        await fs.promises.writeFile(this.filePath, JSON.stringify(data, null, 2));
    }
}
