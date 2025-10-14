
import {Container} from "inversify";
import {IpcHandlerRegistry} from "./ipc";
import {ModelProviderService} from "./services/modelProviderService";
import {coreContainer} from "../core/inversify.config";
import {TYPES} from "./types";
import {ChatController} from "../core/controllers/ChatController";
import {Controller} from "../core/controllers/Controller";
import {MessageController} from "../core/controllers/MessageController";

const container = new Container({parent: coreContainer});

container.bind<IpcHandlerRegistry>(TYPES.IpcHandlerRegistry).to(IpcHandlerRegistry).inSingletonScope();
container.bind<ModelProviderService>(TYPES.ModelProviderService).to(ModelProviderService).inSingletonScope();

// Bind controllers
container.bind<Controller>(TYPES.Controller).to(ChatController).inSingletonScope();
container.bind<Controller>(TYPES.Controller).to(MessageController).inSingletonScope();

export default container;
