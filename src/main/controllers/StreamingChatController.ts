import {convertToModelMessages, ModelMessage, RetryError, smoothStream, streamText} from 'ai';
import {IpcMainEvent, WebContents} from "electron";
import {inject, injectable} from "inversify";
import {IpcController, IpcOn, IpcRendererOn} from "../ipc/Decorators";
import {ChatAbortArgs, ChatSendMessageArgs} from "core/dto";
import {Controller} from "./Controller";
import {CORETYPES} from "core/types/types";
import {ModelProviderService} from "core/services/ModelProviderService";
import {MessageService} from "core/services/MessageService";
import log from 'electron-log/main';

@injectable()
@IpcController("streamingChat")
export class StreamingChatController implements Controller {
    private readonly activeStreams = new Map<string, AbortController>();

    constructor(@inject(CORETYPES.ModelProviderService)
                private modelProviderService: ModelProviderService,
                @inject(CORETYPES.MessageService)
                private messageService: MessageService) {
    }

    @IpcOn("sendMessage")
    public async sendMessage(args: ChatSendMessageArgs, event: IpcMainEvent) {
        const modelProviderRegistry = await this.modelProviderService.getModelProviderRegistry();
        const webContents = event.sender as WebContents;
        const modelMessages: ModelMessage[] = convertToModelMessages(args.messages);

        const controller = new AbortController();
        this.activeStreams.set(args.streamChannel, controller);
        const lastUserMsg = args.messages[args.messages.length - 1];
        const txtMsg = lastUserMsg.parts.find(part => part.type === 'text')?.text;
        const rsnMsg = lastUserMsg.parts.find(part => part.type === 'reasoning')?.text;

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
                experimental_transform: smoothStream(),
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
                    log.error("Stream error:", error);
                    let msg = error.error;
                    if (RetryError.isInstance(error)) {
                        msg = error.lastError;
                    }
                    if (!webContents.isDestroyed()) {
                        webContents.send(`${args.streamChannel}-error`, msg);
                    }
                    this.activeStreams.delete(args.streamChannel);

                }
            });

            for await (const chunk of result.toUIMessageStream({
                sendReasoning: true,
                sendSources: true
            })) {
                if (webContents.isDestroyed()) {
                    log.info("WebContents destroyed, stopping stream.");
                    controller.abort();
                    break;
                }
                webContents.send(`${args.streamChannel}-data`, chunk);

            }
        } catch (error) {
            log.error("Failed to start streamText:", error);
            this.activeStreams.delete(args.streamChannel);
            if (!webContents.isDestroyed()) {
                webContents.send(`${args.streamChannel}-error`, error);
            }
        }
    }

    @IpcOn("abortMessage")
    public abortMessage(args: ChatAbortArgs) {
        const controller = this.activeStreams.get(args.streamChannel);
        if (controller) {
            controller.abort();
            this.activeStreams.delete(args.streamChannel);
            log.info(`Aborted stream for channel: ${args.streamChannel}`);
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
