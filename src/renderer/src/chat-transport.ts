import {ChatRequestOptions, ChatTransport, UIMessageChunk} from 'ai'
import {ChatMessage} from '@/lib/types'

// Note: The global AbortSignal type is used directly, no import needed for modern browsers/environments.
// Note: The browser's native ReadableStream is used, no import needed.

export class IpcChatTransport implements ChatTransport<ChatMessage> {
    reconnectToStream(
        options: {
            chatId: string
        } & ChatRequestOptions
    ): Promise<ReadableStream<UIMessageChunk> | null> {
        const chatId = options.chatId;
        const streamChannel = `chat-stream-${chatId}`;

        const stream = new ReadableStream<UIMessageChunk>({
            start(controller) {
                const onData = (chunk: UIMessageChunk) => {
                    controller.enqueue(chunk);
                }
                const onEnd = () => {
                    cleanup();
                    controller.close();
                };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const onError = (err: any) => {
                    cleanup();
                    controller.error(new Error(err?.message || 'Stream Error'));
                }

                const cleanup = () => {
                    window.api.streaming.removeListeners(streamChannel);
                };

                window.api.streaming.onData(`${streamChannel}`, onData);
                window.api.streaming.onEnd(`${streamChannel}`, onEnd);
                window.api.streaming.onError(`${streamChannel}`, onError);

            }
        });
        return Promise.resolve(stream);
    }

    sendMessages(
        options: {
            trigger: 'submit-message' | 'regenerate-message'
            chatId: string
            messageId: string | undefined
            messages: ChatMessage[]
            abortSignal: AbortSignal | undefined
        } & ChatRequestOptions
    ): Promise<ReadableStream<UIMessageChunk>> {
        const chatId = options.chatId;
        const streamChannel = `chat-stream-${chatId}`;

        const stream = new ReadableStream<UIMessageChunk>({
            start(controller) {
                const onData = (chunk: UIMessageChunk) => {
                    controller.enqueue(chunk);
                }
                const onEnd = () => {
                    cleanup();
                    controller.close();
                };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const onError = (err: any) => {
                    cleanup();
                    controller.error(new Error(err?.message || 'Stream Error'));
                }

                const cleanup = () => {
                    window.api.streaming.removeListeners(streamChannel);
                };

                window.api.streaming.onData(`${streamChannel}`, onData);
                window.api.streaming.onEnd(`${streamChannel}`, onEnd);
                window.api.streaming.onError(`${streamChannel}`, onError);

                // Send to main process
                const messages = options.messages;
                window.api.streaming.sendMessage({
                    chatId, messages, streamChannel, modelIdentifier: 'openai:gpt-5-nano'
                });

                if (options.abortSignal) {
                    options.abortSignal.addEventListener('abort', () => {
                        cleanup();
                        window.api.streaming.abortMessage({streamChannel});
                        controller.error(new Error('Aborted by user'));
                    });
                }
            }, cancel() {
                window.api.streaming.abortMessage({streamChannel});
            }
        });
        return Promise.resolve(stream);
    }
}
