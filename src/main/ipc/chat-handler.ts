import { ipcMain } from 'electron';
import { streamText, ModelMessage } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import WebContents = Electron.Main.WebContents;


const GEMINI_API_KEY = "<add your key here>";
const activeStreams = new Map<string, AbortController>();
const google = createGoogleGenerativeAI({apiKey: GEMINI_API_KEY})

ipcMain.on('chat-send-messages', async (event, args) => {
    const webContents = event.sender as WebContents;
    const {
        chatId,
        messages,
        streamChannel,
    }: {
        chatId: string;
        messages: ModelMessage[];
        streamChannel: string;
    } = args;

    const controller = new AbortController();
    activeStreams.set(streamChannel, controller);

    console.log("Received message from chatId " + chatId);

    streamText({
        model: google('gemini-2.0-flash-lite'),
        messages,
        abortSignal: controller.signal,
        onChunk: async (chunk) => {
            webContents.send(`${streamChannel}-data`, chunk);
        },
        onFinish: async () => {
            activeStreams.delete(streamChannel);
            webContents.send(`${streamChannel}-end`);
        },
        onAbort: async () => {
            const controller = activeStreams.get(streamChannel);
            if (controller) {
                controller.abort();
            }
            activeStreams.delete(streamChannel);
            webContents.send(`${streamChannel}-abort`);
        },
        onError: async (error) => {
            activeStreams.delete(streamChannel);
            webContents.send(`${streamChannel}-error`, error);
        }
    });
});

ipcMain.on('chat-abort', (_event, { streamChannel }) => {
    const controller = activeStreams.get(streamChannel);
    if (controller) {
        controller.abort();
        activeStreams.delete(streamChannel);
    }
});
