const CORETYPES = {
    DatabaseManager: Symbol.for("DatabaseManager"),
    // repositories
    ChatRepository: Symbol.for("ChatRepository"),
    MessageRepository: Symbol.for("MessageRepository"),
    ModelProviderRepository: Symbol.for("ModelProviderRepository"),
    // services
    ChatService: Symbol.for("ChatService"),
    MessageService: Symbol.for("MessageService"),
    ModelProvider: Symbol.for("ModelProviderService"),
    // controllers
    ChatController: Symbol.for("ChatController"),
    MessageController: Symbol.for("MessageController"),
};

export { CORETYPES };