
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { IPC_CONTROLLER_METADATA_KEY, IPC_HANDLE_METADATA_KEY, IPC_ON_METADATA_KEY } from '../src/main/ipc/Decorators';
import { ChatController } from '../src/main/controllers/ChatController';
import { ModelProviderController } from '../src/main/controllers/ModelProviderController';
import { StreamingChatController } from '../src/main/controllers/StreamingChatController';

const apiFilePath = path.resolve(__dirname, '../src/preload/api.ts');

const controllers = [ChatController, ModelProviderController, StreamingChatController];

const controllerPaths = {
    'ChatController': path.resolve(__dirname, '../src/main/controllers/ChatController.ts'),
    'ModelProviderController': path.resolve(__dirname, '../src/main/controllers/ModelProviderController.ts'),
    'StreamingChatController': path.resolve(__dirname, '../src/main/controllers/StreamingChatController.ts'),
};

const controllerFileContents: { [key: string]: string } = {};
for (const controllerName in controllerPaths) {
    controllerFileContents[controllerName] = fs.readFileSync(controllerPaths[controllerName as keyof typeof controllerPaths], 'utf-8');
}

function getMethodSignature(controllerFileContent: string, methodName: string): { params: string, args: string, returnType: string } {
    const methodRegex = new RegExp(`(?:@IpcHandler\\(|@IpcOn\\()\"[^\"]+\"\\)[\\s\\S]*?public (?:async )?${methodName}\\s*\\(([^)]*)\\)(?::\\s*([^{]*))?`, 'm');
    const match = controllerFileContent.match(methodRegex);

    if (match) {
        const paramsStr = match[1] ? match[1].trim() : '';
        let returnType = match[2] ? match[2].trim() : 'void';

        if (returnType.startsWith('Promise')) {
            returnType = returnType.replace(/Promise<(.+)>/, '$1');
        }

        if (!paramsStr) {
            return { params: '', args: '', returnType };
        }

        const paramParts = paramsStr.split(',').map(p => p.trim()).filter(p => p && !p.includes('IpcMainEvent'));
        const typedParams = paramParts.join(', ');
        const argNames = paramParts.map(p => p.split(':')[0].trim()).filter(Boolean).join(', ');

        return { params: typedParams, args: argNames, returnType };
    }

    console.warn(`Could not find signature for method ${methodName}. Falling back to void.`);
    return { params: '', args: '', returnType: 'void' };
}

const apiGroups: { [key: string]: string[] } = {};
const onHandlers: string[] = [];
const apiGroupInterfaces: { [key: string]: string[] } = {};
const onHandlerInterfaceMembers: string[] = [];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

for (const controller of controllers) {
    const controllerName = controller.name;
    const controllerContent = controllerFileContents[controllerName];
    if (!controllerContent) {
        console.error(`Could not read content of controller ${controllerName}`);
        continue;
    }

    const controllerPrefix = Reflect.getMetadata(IPC_CONTROLLER_METADATA_KEY, controller);

    if (controllerPrefix) {
        if (!apiGroups[controllerPrefix]) {
            apiGroups[controllerPrefix] = [];
            apiGroupInterfaces[controllerPrefix] = [];
        }
    }

    const handleMetadata = Reflect.getMetadata(IPC_HANDLE_METADATA_KEY, controller) || {};
    for (const methodName in handleMetadata) {
        const handlerName = handleMetadata[methodName];
        const channel = controllerPrefix !== undefined ? `${controllerPrefix}:${handlerName}` : handlerName;
        if (controllerPrefix !== undefined) {
            const { params, args, returnType } = getMethodSignature(controllerContent, methodName);
            const methodArgs = args ? `, ${args}` : '';
            apiGroups[controllerPrefix].push(`    ${methodName}: (${params}) => ipcRenderer.invoke('${channel}'${methodArgs})`);
            apiGroupInterfaces[controllerPrefix].push(`    ${methodName}(${params}): Promise<${returnType}>;`);
        }
    }

    const onMetadata = Reflect.getMetadata(IPC_ON_METADATA_KEY, controller) || {};
    for (const methodName in onMetadata) {
        const handlerName = onMetadata[methodName];
        const channel = controllerPrefix !== undefined ? `${controllerPrefix}:${handlerName}` : handlerName;
        const { params, args } = getMethodSignature(controllerContent, methodName);
        const methodArgs = args ? `, ${args}` : '';
        onHandlers.push(`    ${methodName}: (${params}) => ipcRenderer.send('${channel}'${methodArgs})`);
        onHandlerInterfaceMembers.push(`    ${methodName}(${params}): void;`);
    }
}

let apiContent = `import { ipcRenderer } from 'electron';
import {
    NewChat,
    ModelProvider,
    ModelProviderCreate,
    ModelProviderLite,
    ChatAbortArgs,
    ChatSendMessageArgs,
    Model,
    Chat
} from '../../src/core/dto';

`;

const mainApiInterfaceMembers: string[] = [];

for (const groupName in apiGroupInterfaces) {
    const interfaceName = `${capitalize(groupName)}Api`;
    if (apiGroupInterfaces[groupName].length > 0) {
        apiContent += `export interface ${interfaceName} {\n${apiGroupInterfaces[groupName].join('\n')}\n}\n\n`;
        mainApiInterfaceMembers.push(`  ${groupName}: ${interfaceName};`);
    }
}

if (onHandlers.length > 0) {
    const streamingInterfaceMembers = [
        ...onHandlerInterfaceMembers,
        '    onData: (channel: string, listener: (data: any) => void) => () => void;',
        '    onEnd: (channel: string, listener: () => void) => () => void;',
        '    onError: (channel: string, listener: (error: any) => void) => () => void;'
    ];
    apiContent += `export interface StreamingApi {\n${streamingInterfaceMembers.join('\n')}\n}\n\n`;
    mainApiInterfaceMembers.push(`  streaming: StreamingApi;`);
}

if (mainApiInterfaceMembers.length > 0) {
    apiContent += `export interface Api {\n${mainApiInterfaceMembers.join('\n')}\n}\n\n`;
}

apiContent += `export const api: Api = {\n`;

for (const groupName in apiGroups) {
    if (apiGroups[groupName].length > 0) {
        apiContent += `  ${groupName}: {\n${apiGroups[groupName].join(',\n')}\n  },\n`;
    }
}

if (onHandlers.length > 0) {
    apiContent += `  streaming: {\n${onHandlers.join(',\n')},\n`;
    apiContent += `    onData: (channel: string, listener: (data: any) => void) => {\n`;
    apiContent += `      const subscription = (_event: any, data: any) => listener(data);\n`;
    apiContent += `      ipcRenderer.on(\`\${channel}-data\`, subscription);\n`;
    apiContent += `      return () => ipcRenderer.removeListener(\`\${channel}-data\`, subscription);\n`;
    apiContent += `    },\n`;
    apiContent += `    onEnd: (channel: string, listener: () => void) => {\n`;
    apiContent += `      ipcRenderer.on(\`\${channel}-end\`, listener);\n`;
    apiContent += `      return () => ipcRenderer.removeAllListeners(\`\${channel}-end\`);\n`;
    apiContent += `    },\n`;
    apiContent += `    onError: (channel: string, listener: (error: any) => void) => {\n`;
    apiContent += `      const subscription = (_event: any, error: any) => listener(error);\n`;
    apiContent += `      ipcRenderer.on(\`\${channel}-error\`, subscription);\n`;
    apiContent += `      return () => ipcRenderer.removeListener(\`\${channel}-error\`, subscription);\n`;
    apiContent += `    },\n`;
    apiContent += `  },\n`;
}

apiContent += `};\n`;

fs.writeFileSync(apiFilePath, apiContent, { encoding: 'utf-8' });

console.log('Successfully generated api.ts');
