
import {ipcMain} from 'electron';
import {injectable, multiInject} from "inversify";
import {
    IPC_CONTROLLER_METADATA_KEY,
    IPC_HANDLER_METADATA_KEY,
} from "./decorators";
import {TYPES} from "../types";
import {Controller} from "../../core/controllers/Controller";

@injectable()
export class IpcHandlerRegistry {

    constructor(@multiInject(TYPES.Controller) private readonly controllers: Controller[]) {
    }

    registerIpcHandlers(): void {
        this.controllers.forEach(controller => {
            const controllerPrefix = Reflect.getMetadata(IPC_CONTROLLER_METADATA_KEY, controller.constructor);
            if (controllerPrefix === undefined) return;

            // Register @IpcHandle decorators
            const handleHandlers = Reflect.getMetadata(IPC_HANDLER_METADATA_KEY, controller.constructor);
            if (handleHandlers) {
                this.registerHandlers(controller, controllerPrefix, handleHandlers, (channel, listener) => ipcMain.handle(channel, listener));
            }

        /*    // Register @IpcOn decorators
            const onHandlers = Reflect.getMetadata(IPC_ON_METADATA_KEY, controller.constructor);
            if (onHandlers) {
                this.registerHandlers(controller, controllerPrefix, onHandlers, (channel, listener) => ipcMain.on(channel, listener));
            }*/
        });
    }

    private registerHandlers(
        controller: any,
        prefix: string,
        handlers: { [methodName: string]: string },
        registerFn: (channel: string, listener: (event: Electron.IpcMainEvent, ...args: any[]) => any) => void
    ) {
        for (const methodName in handlers) {
            if (Object.prototype.hasOwnProperty.call(handlers, methodName)) {
                const handlerName = handlers[methodName];
                const channel = `${prefix}:${handlerName}`;

                registerFn(channel, async (event, ...args) => {
                    // eslint-disable-next-line @typescript-eslint/ban-types
                    const method = controller[methodName] as Function;
                    return method.apply(controller, [...args]);
                });
            }
        }
    }
}
