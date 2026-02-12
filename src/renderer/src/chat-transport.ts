import { ChatRequestOptions, ChatTransport, UIMessage, UIMessageChunk } from 'ai'

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
                const onData = (chunk: unknown) => {
                    controller.enqueue(chunk as UIMessageChunk);
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

    async sendMessages(
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

        // Get modelId from metadata or fetch from chat
        const metadata = options?.metadata as { modelId?: string; personaId?: string } | undefined;
        let modelId = metadata?.modelId;
        let personaId = metadata?.personaId;

        // Fallback: fetch from chat if not in metadata (e.g., tool approval continuation)
        if (!modelId) {
            try {
                const chat = await window.api.chat.getChatById(chatId);
                if (chat?.selectedProvider && chat?.selectedModelId) {
                    modelId = `${chat.selectedProvider}:${chat.selectedModelId}`;
                    personaId = personaId || chat.selectedPersonaId || undefined;
                }
            } catch (e) {
                console.error('Failed to fetch chat for model info:', e);
            }
        }

        if (!modelId) {
            return Promise.reject(new Error('modelId is required - neither in metadata nor found in chat'));
        }

        const finalModelId = modelId;
        const finalPersonaId = personaId;

        const stream = new ReadableStream<UIMessageChunk>({
            start(controller) {
                const onData = (chunk: unknown) => {
                    controller.enqueue(chunk as UIMessageChunk);
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

                window.api.streaming.sendMessage({
                    chatId, messages, streamChannel,
                    modelIdentifier: finalModelId,
                    personaId: finalPersonaId,
                });

                if (options.abortSignal) {
                    options.abortSignal.addEventListener('abort', () => {
                        cleanup();
                        window.api.streaming.abortMessage({ streamChannel });
                        controller.error(new Error('Aborted by user'));
                    });
                }
            }, cancel() {
                window.api.streaming.abortMessage({ streamChannel });
            }
        });
        return Promise.resolve(stream);
    }
}
