import {convertToModelMessages, ModelMessage, RetryError, smoothStream, streamText} from 'ai';
import {IpcMainEvent, WebContents} from "electron";
import {inject, injectable} from "inversify";
import {IpcController, IpcOn, IpcRendererOn} from "../ipc/Decorators";
import {ChatAbortArgs, ChatSendMessageArgs} from "core/dto";
import {Controller} from "./Controller";
import {CORETYPES} from "core/types/types";
import {ModelProviderService} from "core/services/ModelProviderService";
import {PersonaService} from "core/services/PersonaService";
import {MessageService} from "core/services/MessageService";
import {logger} from "../logger";

@injectable()
@IpcController("streamingChat")
export class StreamingChatController implements Controller {
    private readonly activeStreams = new Map<string, AbortController>();

    constructor(@inject(CORETYPES.ModelProviderService)
                private modelProviderService: ModelProviderService,
                @inject(CORETYPES.MessageService)
                private messageService: MessageService,
                @inject(CORETYPES.PersonaService)
                private personaService: PersonaService) {
    }

    @IpcOn("sendMessage")
    public async sendMessage(args: ChatSendMessageArgs, event: IpcMainEvent) {
        const modelProviderRegistry = await this.modelProviderService.getModelProviderRegistry();
        const webContents = event.sender as WebContents;
        const personaInjection = await this.applyPersonaToMessages(args.messages);
        if (!personaInjection.lastUserMessage) {
            logger.warn("No user message provided for streaming.");
            return;
        }
        const modelMessages: ModelMessage[] = convertToModelMessages(personaInjection.messages);

        const controller = new AbortController();
        this.activeStreams.set(args.streamChannel, controller);
        const lastUserMsg = personaInjection.lastUserMessage;
        const txtMsg = lastUserMsg.parts.find(part => part.type === 'text')?.text;
        const rsnMsg = lastUserMsg.parts.find(part => part.type === 'reasoning')?.text;

        if (personaInjection.systemMessage) {
            await this.messageService.createMessage({
                chatId: args.chatId,
                role: personaInjection.systemMessage.role,
                text: personaInjection.systemMessage.parts.find(part => part.type === 'text')?.text ?? null,
                reasoning: null
            });
        }
        await this.messageService.createMessage({
            chatId: args.chatId,
            role: lastUserMsg.role,
            text: txtMsg ?? null,
            reasoning: rsnMsg ?? null
        });
        try {

            const result = streamText({
                // @ts-expect-error/type-does-not-exist
                // model: modelProviderRegistry.languageModel(args.modelIdentifier),
                model: modelProviderRegistry.languageModel(args.modelIdentifier),
                messages: modelMessages,
                abortSignal: controller.signal,
                experimental_transform: smoothStream({delayInMs: 30}),
                onFinish: (result) => {
                    this.messageService.createMessage({
                        chatId: args.chatId,
                        role: 'assistant',
                        text: result.text ?? null,
                        reasoning: result.reasoningText ?? null,
                    });
                    this.activeStreams.delete(args.streamChannel);
                    if (!webContents.isDestroyed()) {
                        webContents.send(`${args.streamChannel}-end`);
                    }
                },
                onAbort: () => {
                    this.activeStreams.delete(args.streamChannel);
                },
                onError: (error) => {
                    logger.error("Stream error:", error);
                    let msg = error.error;
                    if (RetryError.isInstance(error)) {
                        msg = error.lastError;
                    }
                    if (!webContents.isDestroyed()) {
                        webContents.send(`${args.streamChannel}-error`, msg);
                    }
                    controller.abort();
                    this.activeStreams.delete(args.streamChannel);
                }
            });

            for await (const chunk of result.toUIMessageStream({
                sendReasoning: true,
                sendSources: true
            })) {
                if (webContents.isDestroyed()) {
                    logger.info("WebContents destroyed, stopping stream.");
                    controller.abort();
                    break;
                }
                webContents.send(`${args.streamChannel}-data`, chunk);

            }
        } catch (error) {
            logger.error("Failed to start streamText:", error);
            controller.abort();
            this.activeStreams.delete(args.streamChannel);
            if (!webContents.isDestroyed()) {
                webContents.send(`${args.streamChannel}-error`, error);
            }
        }
    }

    private async applyPersonaToMessages(messages: ChatSendMessageArgs['messages']) {
        if (messages.length === 0) {
            return {messages, lastUserMessage: null, systemMessage: null};
        }

        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage.role !== 'user') {
            return {messages, lastUserMessage, systemMessage: null};
        }

        const textPartIndex = lastUserMessage.parts.findIndex(part => part.type === 'text');
        if (textPartIndex === -1) {
            return {messages, lastUserMessage, systemMessage: null};
        }

        const textPart = lastUserMessage.parts[textPartIndex];
        const matches = Array.from(textPart.text.matchAll(/@([\w-]+)/g));
        if (matches.length === 0) {
            return {messages, lastUserMessage, systemMessage: null};
        }

        let persona;
        let matchedToken = '';
        for (const match of matches) {
            const personaName = match[1];
            // eslint-disable-next-line no-await-in-loop
            const candidate = await this.personaService.getByName(personaName);
            if (candidate) {
                persona = candidate;
                matchedToken = match[0];
                break;
            }
        }

        if (!persona) {
            return {messages, lastUserMessage, systemMessage: null};
        }

        const escapedToken = matchedToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const cleanedText = textPart.text
            .replace(new RegExp(escapedToken, 'g'), '')
            .replace(/\s{2,}/g, ' ')
            .trim();
        const updatedLastUserMessage = {
            ...lastUserMessage,
            parts: lastUserMessage.parts.map((part, index) => index === textPartIndex
                ? {...part, text: cleanedText}
                : part
            )
        };

        const systemMessage = {
            id: `persona-${persona.id}`,
            role: 'system' as const,
            parts: [{type: 'text' as const, text: persona.details}]
        };

        const updatedMessages = messages.slice(0, -1).concat(updatedLastUserMessage);

        return {
            messages: [systemMessage, ...updatedMessages],
            lastUserMessage: updatedLastUserMessage,
            systemMessage
        };
    }

    @IpcOn("abortMessage")
    public abortMessage(args: ChatAbortArgs) {
        const controller = this.activeStreams.get(args.streamChannel);
        if (controller) {
            controller.abort();
            this.activeStreams.delete(args.streamChannel);
            logger.info(`Aborted stream for channel: ${args.streamChannel}`);
        }
    }

    @IpcRendererOn("data")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onData(channel: string, listener: (data: any) => void): () => void {
        return () => {
        };
    }

    @IpcRendererOn("end")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onEnd(channel: string, listener: () => void): () => void {
        return () => {
        };
    }

    @IpcRendererOn("error")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onError(channel: string, listener: (error: any) => void): () => void {
        return () => {
        };
    }
}
