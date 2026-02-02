const CORETYPES = {
    DatabaseManager: Symbol.for("DatabaseManager"),
    // repositories
    ChatRepository: Symbol.for("ChatRepository"),
    MessageRepository: Symbol.for("MessageRepository"),
    ModelProviderRepository: Symbol.for("ModelProviderRepository"),
    PersonaRepository: Symbol.for("PersonaRepository"),
    SlashCommandRepository: Symbol.for("SlashCommandRepository"),
    // services
    ChatService: Symbol.for("ChatService"),
    MessageService: Symbol.for("MessageService"),
    ModelProviderService: Symbol.for("ModelProviderService"),
    PersonaService: Symbol.for("PersonaService"),
    SlashCommandService: Symbol.for("SlashCommandService"),
};

export {CORETYPES};
