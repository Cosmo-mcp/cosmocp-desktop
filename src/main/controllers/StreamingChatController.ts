import {convertToModelMessages, ModelMessage, smoothStream, streamText, createProviderRegistry} from 'ai';
import {createGoogleGenerativeAI} from '@ai-sdk/google';
import {createOpenAI} from '@ai-sdk/openai';
import {createAnthropic} from '@ai-sdk/anthropic';
import {config} from 'dotenv';
import {IpcMainEvent, WebContents} from "electron";
import {injectable} from "inversify";
import {IpcController, IpcOn, IpcRendererOn} from "../ipc/Decorators";
import {ChatAbortArgs, ChatSendMessageArgs} from "core/dto";
import {Controller} from "./Controller";

@injectable()
@IpcController("streamingChat")
export class StreamingChatController implements Controller {
    private readonly activeStreams = new Map<string, AbortController>();
    private readonly modelProviderRegistry;

    constructor() {
        config();
        const openaiApiKey = process.env['OPENAI_API_KEY'];
        const geminiApiKey = process.env['GEMINI_API_KEY'];
        const anthropicApiKey = process.env['ANTHROPIC_API_KEY'];

        this.modelProviderRegistry = createProviderRegistry({
            anthropic: createAnthropic({apiKey: anthropicApiKey}),
            openai: createOpenAI({apiKey: openaiApiKey}),
            gemini: createGoogleGenerativeAI({apiKey: geminiApiKey}),
        });
    }

    @IpcOn("sendMessage")
    public async sendMessage(args: ChatSendMessageArgs, event: IpcMainEvent) {
        const webContents = event.sender as WebContents;
        const modelMessages: ModelMessage[] = convertToModelMessages(args.messages);

        const controller = new AbortController();
        this.activeStreams.set(args.streamChannel, controller);

        try {

            const result = streamText({
                // @ts-expect-error/type-does-not-exist
                model: this.modelProviderRegistry.languageModel(args.modelIdentifier),
                messages: modelMessages,
                abortSignal: controller.signal,
                experimental_transform: smoothStream(),
                onFinish: () => {
                    this.activeStreams.delete(args.streamChannel);
                    if (!webContents.isDestroyed()) {
                        webContents.send(`${args.streamChannel}-end`);
                    }
                },
                onAbort: () => {
                    this.activeStreams.delete(args.streamChannel);
                },
                onError: (error) => {
                    console.error("Stream error:", error);
                    this.activeStreams.delete(args.streamChannel);
                    if (!webContents.isDestroyed()) {
                        webContents.send(`${args.streamChannel}-error`, error);
                    }
                }
            });

            for await (const chunk of result.toUIMessageStream({
                sendReasoning: true,
                sendSources: true
            })) {
                console.log(chunk);
                if (webContents.isDestroyed()) {
                    console.log("WebContents destroyed, stopping stream.");
                    controller.abort();
                    break;
                }
                webContents.send(`${args.streamChannel}-data`, chunk);

            }
        } catch (error) {
            console.error("Failed to start streamText:", error);
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
            console.log(`Aborted stream for channel: ${args.streamChannel}`);
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
