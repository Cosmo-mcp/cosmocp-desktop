import {app, safeStorage} from 'electron';
import fs from 'fs';
import path from 'path';

const KEY_STORE_FILE = path.join(app.getPath('appData'), 'api-keys.json');

function loadKeyFile() {
    if (!fs.existsSync(KEY_STORE_FILE)) return {};
    const raw = fs.readFileSync(KEY_STORE_FILE, 'utf8');
    return JSON.parse(raw);
}

function saveKeyFile(data: {string: string}) {
    fs.writeFileSync(KEY_STORE_FILE, JSON.stringify(data));
}

const keyStoreService = {
    saveKey: (keyProvider: string, apiKey: string, metadata = {}) => {
        if (!safeStorage.isEncryptionAvailable()) {
            throw new Error('Encryption not available');
        }

        const data = loadKeyFile();

        data[keyProvider] = {
            encrypted: safeStorage.encryptString(apiKey).toString('base64'),
            metadata,
        };
        saveKeyFile(data);
    },

    loadKey: (keyProvider: string) => {
        const data = loadKeyFile();
        const entry = data[keyProvider];
        if (!entry) return null;

        const encryptedBuffer = Buffer.from(entry.encrypted, 'base64');
        return {
            key: safeStorage.decryptString(encryptedBuffer),
            metadata: entry.metadata,
        };
    },

    listProviders: () => {
        const data = loadKeyFile();
        return Object.keys(data);
    },

    deleteKey: (keyProvider: string) => {
        const data = loadKeyFile();
        delete data[keyProvider];
        saveKeyFile(data);
    },
};

module.exports = keyStoreService;
