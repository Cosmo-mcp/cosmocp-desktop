import {Container} from "inversify";
import {IpcHandlerRegistry} from "./ipc";
import {ChatHandler} from "./ipc/chat-handler";
import {coreContainer} from "../core/inversify.config";
import {TYPES} from "./types";

const container = new Container({parent: coreContainer});

container.bind<IpcHandlerRegistry>(TYPES.IpcHandlerRegistry).to(IpcHandlerRegistry).inSingletonScope();
container.bind<ChatHandler>(TYPES.ChatHandler).to(ChatHandler).inSingletonScope();

export default container;
