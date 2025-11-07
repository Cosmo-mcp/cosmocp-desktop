import {convertToModelMessages, ModelMessage, smoothStream, streamText} from 'ai';
import {createGoogleGenerativeAI, GoogleGenerativeAIProvider} from '@ai-sdk/google';
import {config} from 'dotenv';
import {IpcMainEvent, WebContents} from "electron";
import {injectable} from "inversify";
import {IpcController, IpcOn, IpcRendererOn} from "../ipc/Decorators";
import {ChatAbortArgs, ChatSendMessageArgs} from "../../../packages/core/dto";
import {Controller} from "./Controller";

@injectable()
@IpcController("streamingChat")
export class StreamingChatController implements Controller {
    private readonly activeStreams = new Map<string, AbortController>();
    private readonly google: GoogleGenerativeAIProvider | null = null;
    private readonly modelName = 'gemini-2.0-flash-lite';

    constructor() {
        config();
        const geminiApiKey = process.env['GEMINI_API_KEY'];
        if (!geminiApiKey) {
            console.error("GEMINI_API_KEY is not set in the environment variables. Chat functionality will be disabled.");
        } else {
            this.google = createGoogleGenerativeAI({apiKey: geminiApiKey});
        }
    }

    @IpcOn("sendMessage")
    public async sendMessage(args: ChatSendMessageArgs, event: IpcMainEvent) {
        if (!this.google) {
            console.error("Google AI client is not initialized. Cannot send message.");
            return;
        }

        const webContents = event.sender as WebContents;
        const modelMessages: ModelMessage[] = convertToModelMessages(args.messages);

        const controller = new AbortController();
        this.activeStreams.set(args.streamChannel, controller);

        try {
            const result = streamText({
                model: this.google(this.modelName),
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

            for await (const chunk of result.toUIMessageStream()) {
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
    public onData(channel: string, listener: (data: any) => void): () => void { return () => {}; }

    @IpcRendererOn("end")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onEnd(channel: string, listener: () => void): () => void { return () => {}; }

    @IpcRendererOn("error")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public onError(channel: string, listener: (error: any) => void): () => void { return () => {}; }
}
