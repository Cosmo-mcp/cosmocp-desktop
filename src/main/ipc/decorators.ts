
import 'reflect-metadata';

export const IPC_CONTROLLER_METADATA_KEY = 'ipc-controller';
export const IPC_HANDLER_METADATA_KEY = 'ipc-handler';

export function IpcController(prefix = ''): ClassDecorator {
    return (target) => {
        Reflect.defineMetadata(IPC_CONTROLLER_METADATA_KEY, prefix, target);
    };
}

export function IpcHandler(name: string): MethodDecorator {
    return (target, propertyKey) => {
        const handlers = Reflect.getMetadata(IPC_HANDLER_METADATA_KEY, target.constructor) || {};
        handlers[propertyKey] = name;
        Reflect.defineMetadata(IPC_HANDLER_METADATA_KEY, handlers, target.constructor);
    };
}
