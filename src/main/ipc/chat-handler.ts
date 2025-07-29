import {streamText, ModelMessage, UIMessage} from 'ai';
import {createGoogleGenerativeAI} from '@ai-sdk/google';
import WebContents = Electron.Main.WebContents;
import IpcMainEvent = Electron.IpcMainEvent;

const GEMINI_API_KEY = "<add your key here>";
const MODEL_NAME = 'gemini-2.0-flash-lite';
const activeStreams = new Map<string, AbortController>();
const google = createGoogleGenerativeAI({apiKey: GEMINI_API_KEY})

export interface ChatSendMessageArgs {
    chatId: string;
    messages: UIMessage[];
    streamChannel: string;
}

export interface ChatAbortArgs {
    streamChannel: string;
}

export async function chatSendMessage(event: IpcMainEvent, args: ChatSendMessageArgs) {
    console.log(`Received chat message for channel: ${args.streamChannel}: `, args.messages);
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

    const controller = new AbortController();
    activeStreams.set(args.streamChannel, controller);

    streamText({
        model: google(MODEL_NAME),
        messages: modelMessages,
        abortSignal: controller.signal,
        onChunk: async (chunk) => {
            webContents.send(`${args.streamChannel}-data`, chunk);
        },
        onFinish: async () => {
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
}

export async function chatAbortMessage(_event: IpcMainEvent, args: ChatAbortArgs) {
    const controller = activeStreams.get(args.streamChannel);
    if (controller) {
        activeStreams.delete(args.streamChannel);
        controller.abort();
    }
}
