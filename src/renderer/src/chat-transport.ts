import {ChatRequestOptions, ChatTransport, UIMessage, UIMessageChunk} from 'ai'

// Note: The global AbortSignal type is used directly, no import needed for modern browsers/environments.
// Note: The browser's native ReadableStream is used, no import needed.

export class IpcChatTransport implements ChatTransport<UIMessage> {
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
                    const msg = err?.error?.message || err?.message || err || 'Stream Error';
                    controller.error(new Error(msg));
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
            messages: UIMessage[]
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
                    // we don't know the structure of err, so being defensive
                    const msg = err?.error?.message || err?.message || err || 'Stream Error';
                    controller.error(new Error(msg));
                }

                const cleanup = () => {
                    window.api.streaming.removeListeners(streamChannel);
                };

                window.api.streaming.onData(`${streamChannel}`, onData);
                window.api.streaming.onEnd(`${streamChannel}`, onEnd);
                window.api.streaming.onError(`${streamChannel}`, onError);

                // Send to main process
                const messages = options.messages;

                const metadata = options?.metadata as {modelId: string; personaId?: string};
                const modelId = metadata.modelId as string;

                window.api.streaming.sendMessage({
                    chatId, messages, streamChannel,
                    modelIdentifier: modelId,
                    personaId: metadata.personaId,
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
