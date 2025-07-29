import { ipcMain } from 'electron';
import { streamText, ModelMessage, UIMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import WebContents = Electron.Main.WebContents;


const GEMINI_API_KEY = "<add your key here>";
const activeStreams = new Map<string, AbortController>();
const google = createGoogleGenerativeAI({apiKey: GEMINI_API_KEY})

ipcMain.on('chat-send-messages', async (event, args: {
    chatId: string;
    messages: UIMessage[];
    streamChannel: string;
}) => {
    const webContents = event.sender as WebContents;
    const modelMessages: ModelMessage[] = args.messages.map((msg) => {
        const textContent = msg.parts
            .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
            .map((part) => part.text)
            .join('');
        return {
            role: msg.role,
            content: textContent,
        };
    });

    const controller = new AbortController();
    activeStreams.set(args.streamChannel, controller);

    console.log("Received message from chatId " + args.chatId);

    streamText({
        model: google('gemini-2.0-flash-lite'),
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
});

ipcMain.on('chat-abort', (_event, { streamChannel }) => {
    const controller = activeStreams.get(streamChannel);
    if (controller) {
        activeStreams.delete(streamChannel);
        controller.abort();
    }
});
