import {ChatRequestOptions, ChatTransport, UIMessageChunk} from "ai";
import {ReadableStream} from "node:stream/web";
import Error from "next/error";
import {ChatMessage} from "@/lib/types";

export class IpcChatTransport implements ChatTransport<ChatMessage> {

    sendMessages({trigger, chatId, messageId, messages, abortSignal}) {
        const streamChannel = `chat-stream-${chatId}`;

        const stream = new ReadableStream<UIMessageChunk>({
            start(controller) {
                const onData = (chunk: UIMessageChunk) => controller.enqueue(chunk);
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
                    window.chatAPI.removeChatListener(`${streamChannel}-data`);
                    window.chatAPI.removeChatListener(`${streamChannel}-end`);
                    window.chatAPI.removeChatListener(`${streamChannel}-error`);
                };

                window.chatAPI.onChatData(`${streamChannel}-data`, onData);
                window.chatAPI.onceChatEnd(`${streamChannel}-end`, onEnd);
                window.chatAPI.onceChatError(`${streamChannel}-error`, onError);

                // Send to main process
                window.chatAPI.sendChatMessages({
                    chatId, messages, streamChannel,
                });

                if (abortSignal) {
                    abortSignal.addEventListener('abort', () => {
                        cleanup();
                        window.chatAPI.abortChat(streamChannel);
                        controller.error(new Error('Aborted by user'));
                    });
                }
            }, cancel() {
                window.chatAPI.abortChat(streamChannel);
            }
        });
        return Promise.resolve(stream);
    }

    reconnectToStream(options: { chatId: string } & ChatRequestOptions): Promise<ReadableStream<UIMessageChunk> | null> {
        return Promise.resolve(undefined);
    }
}
