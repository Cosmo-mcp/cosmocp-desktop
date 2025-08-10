import {ModelMessage, streamText} from 'ai';
import {createGoogleGenerativeAI} from '@ai-sdk/google';
import {config} from 'dotenv';
import {ChatMessage} from "../../renderer/src/lib/types";
import WebContents = Electron.Main.WebContents;
import IpcMainEvent = Electron.IpcMainEvent;

config();

const GEMINI_API_KEY = process.env['GEMINI-API-KEY'];
const MODEL_NAME = 'gemini-2.0-flash-lite';
const activeStreams = new Map<string, AbortController>();
const google = createGoogleGenerativeAI({apiKey: GEMINI_API_KEY})

export interface ChatSendMessageArgs {
    chatId: string;
    messages: ChatMessage[];
    streamChannel: string;
}

export interface ChatAbortArgs {
    streamChannel: string;
}

export async function chatSendMessage(event: IpcMainEvent, args: ChatSendMessageArgs) {
    const webContents = event.sender as WebContents;
    const modelMessages: ModelMessage[] = args.messages.map(msg => {
        const textContent = msg.parts
            .filter(part => part.type === 'text')
            .map(part => part.text)
            .join('');
        return {
            role: msg.role,
            content: textContent,
        };
    });

    console.log(`Model messages for channel ${args.streamChannel}:`);
    modelMessages.forEach(msg => console.log(msg));

    const controller = new AbortController();
    activeStreams.set(args.streamChannel, controller);

    const result = streamText({
        model: google(MODEL_NAME),
        messages: modelMessages,
        abortSignal: controller.signal,
        onFinish: async () => {
            console.log('Finished receiving chunk');
            activeStreams.delete(args.streamChannel);
            webContents.send(`${args.streamChannel}-end`);
        },
        onAbort: async () => {
            activeStreams.delete(args.streamChannel);
        },
        onError: async (error) => {
            activeStreams.delete(args.streamChannel);
            webContents.send(`${args.streamChannel}-error`, error);
        }
    });

    const reader = result.fullStream.getReader();

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        console.log('Received chunk', value);
        webContents.send(`${args.streamChannel}-data`, value);
    }
}

export async function chatAbortMessage(_event: IpcMainEvent, args: ChatAbortArgs) {
    const controller = activeStreams.get(args.streamChannel);
    if (controller) {
        activeStreams.delete(args.streamChannel);
        controller.abort();
    }
}
