import { modelProvider, providerTypeEnum } from './modelProviderSchemaNew';
import { chat } from './chatSchema';
import { message } from './messageSchema';

export const schema = {
    modelProvider,
    providerTypeEnum, // IMPORTANT: Must also export enums!
    chat,
    message,
};