import {ChatRequestOptions, ChatTransport, convertToModelMessages, streamText, UIMessageChunk} from 'ai'
import {ChatMessage} from '@/lib/types'
import {createGoogleGenerativeAI} from '@ai-sdk/google';

// Note: The global AbortSignal type is used directly, no import needed for modern browsers/environments.
// Note: The browser's native ReadableStream is used, no import needed.

const GEMINI_API_KEY = "<api-key-here>";
const MODEL_NAME = 'gemini-2.0-flash-lite';
const google = createGoogleGenerativeAI({apiKey: GEMINI_API_KEY})

export class IpcChatTransport implements ChatTransport<ChatMessage> {
    // ignore for now
    async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
        return Promise.resolve(null);
    }

    async sendMessages(
        options: {
            trigger: 'submit-message' | 'regenerate-message'
            chatId: string
            messageId: string | undefined
            messages: ChatMessage[]
            abortSignal: AbortSignal | undefined
        } & ChatRequestOptions
    ): Promise<ReadableStream<UIMessageChunk>> {
        const prompt = convertToModelMessages(options.messages);

        const result = streamText({
            model: google(MODEL_NAME),
            messages: prompt,
            abortSignal: options.abortSignal,
        });

        return result.toUIMessageStream();
    }
}
