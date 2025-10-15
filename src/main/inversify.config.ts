import {Container} from "inversify";
import {IpcHandlerRegistry} from "./ipc";
import {coreContainer} from "../core/inversify.config";
import {TYPES} from "./types";
import {ChatController} from "./controllers/ChatController";
import {ModelProviderController} from "./controllers/ModelProviderController";
import {Controller} from "./controllers/Controller";

const container = new Container({parent: coreContainer});

container.bind<IpcHandlerRegistry>(TYPES.IpcHandlerRegistry).to(IpcHandlerRegistry).inSingletonScope();

// Bind controllers
container.bind<Controller>(TYPES.Controller).to(ChatController).inSingletonScope();
container.bind<Controller>(TYPES.Controller).to(ModelProviderController).inSingletonScope();

export default container;
