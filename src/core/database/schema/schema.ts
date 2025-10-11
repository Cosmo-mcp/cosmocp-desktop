import * as modelProvider from './modelProviderSchema';
import * as chat from './chatSchema';
import * as message from './messageSchema';

// Re-export all schemas merged into a single object
export const schema = {
    ...modelProvider,
    ...chat,
    ...message,
    // Add any other table schema exports here
};