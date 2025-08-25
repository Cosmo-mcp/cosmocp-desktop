'use client';

import cx from 'classnames';
import type React from 'react';
import {type ChangeEvent, type Dispatch, memo, SetStateAction, useCallback, useRef, useState,} from 'react';
import {toast} from 'sonner';
import {useWindowSize} from 'usehooks-ts';

import {ArrowUpIcon, PaperclipIcon, StopIcon} from './icons';
import {PreviewAttachment} from './preview-attachment';
import {Button} from './ui/button';
import {Textarea} from './ui/textarea';
import {SuggestedActions} from './suggested-actions';
import equal from 'fast-deep-equal';
import type {UseChatHelpers} from '@ai-sdk/react';
import {AnimatePresence, motion} from 'framer-motion';
import {ArrowDown} from 'lucide-react';
import {useScrollToBottom} from '@/hooks/use-scroll-to-bottom';
import type {Attachment, ChatMessage} from '@/lib/types';

function PureMultimodalInput({
                                 chatId,
                                 input,
                                 setInput,
                                 status,
                                 stop,
                                 attachments,
                                 setAttachments,
                                 setMessages,
                                 sendMessage,
                                 className,
                                 showSuggestedActions,
                                 stillAnswering,
                                 setForceScrollToBottom
                             }: {
    chatId: string,
    input: string,
    setInput: Dispatch<SetStateAction<string>>,
    status: UseChatHelpers<ChatMessage>['status'],
    stop: () => void,
    attachments: Array<Attachment>,
    setAttachments: Dispatch<SetStateAction<Array<Attachment>>>,
    setMessages: UseChatHelpers<ChatMessage>['setMessages'],
    sendMessage: UseChatHelpers<ChatMessage>['sendMessage'],
    className?: string,
    showSuggestedActions?: boolean,
    stillAnswering?: boolean,
    setForceScrollToBottom?: Dispatch<SetStateAction<boolean>>
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const {width} = useWindowSize();

    const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(event.target.value);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

    const submitForm = useCallback(() => {
        sendMessage({
            role: 'user',
            parts: [
                ...attachments.map((attachment) => ({
                    type: 'file' as const,
                    url: attachment.url,
                    name: attachment.name,
                    mediaType: attachment.contentType,
                })),
                {
                    type: 'text',
                    text: input,
                },
            ],
        }).then(() => {
            console.log("in then")
        }).catch(() => {
            console.log("in catch")
        }).finally(() => {
            console.log("in finally")
        })

        setAttachments([]);
        setInput('');

        // reset scroll on form submit
        if (setForceScrollToBottom) {
            setForceScrollToBottom(false);
        }

        if (width && width > 768) {
            textareaRef.current?.focus();
        }
    }, [sendMessage, attachments, input, setAttachments, setInput, setForceScrollToBottom, width]);

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                const {url, pathname, contentType} = data;

                return {
                    url,
                    name: pathname,
                    contentType: contentType,
                };
            }
            const {error} = await response.json();
            toast.error(error);
        } catch (error) {
            toast.error('Failed to upload file, please try again! ' + error);
        }
    };

    const handleFileChange = useCallback(
        async (event: ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(event.target.files || []);

            setUploadQueue(files.map((file) => file.name));

            try {
                const uploadPromises = files.map((file) => uploadFile(file));
                const uploadedAttachments = await Promise.all(uploadPromises);
                const successfullyUploadedAttachments = uploadedAttachments.filter(
                    (attachment) => attachment !== undefined,
                );

                setAttachments((currentAttachments) => [
                    ...currentAttachments,
                    ...successfullyUploadedAttachments,
                ]);
            } catch (error) {
                console.error('Error uploading files!', error);
            } finally {
                setUploadQueue([]);
            }
        },
        [setAttachments],
    );

    const {isAtBottom, scrollToBottom} = useScrollToBottom();

    return (
        <div className="relative w-full flex flex-col gap-4">
            <AnimatePresence>
                {!isAtBottom && (
                    <motion.div
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: 10}}
                        transition={{type: 'spring', stiffness: 300, damping: 20}}
                        className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
                    >
                        <Button
                            data-testid="scroll-to-bottom-button"
                            className="rounded-full"
                            size="icon"
                            variant="outline"
                            onClick={(event) => {
                                event.preventDefault();
                                scrollToBottom();
                            }}
                        >
                            <ArrowDown/>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {showSuggestedActions &&
                uploadQueue.length === 0 && (
                    <SuggestedActions
                        sendMessage={sendMessage}
                        chatId={chatId}
                    />
                )}

            <input
                type="file"
                className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
                ref={fileInputRef}
                multiple
                onChange={handleFileChange}
                tabIndex={-1}
            />

            {(attachments.length > 0 || uploadQueue.length > 0) && (
                <div
                    data-testid="attachments-preview"
                    className="flex flex-row gap-2 overflow-x-scroll items-end"
                >
                    {attachments.map((attachment) => (
                        <PreviewAttachment key={attachment.url} attachment={attachment}/>
                    ))}

                    {uploadQueue.map((filename) => (
                        <PreviewAttachment
                            key={filename}
                            attachment={{
                                url: '',
                                name: filename,
                                contentType: '',
                            }}
                            isUploading={true}
                        />
                    ))}
                </div>
            )}

            <Textarea
                data-testid="multimodal-input"
                ref={textareaRef}
                placeholder="Send a message..."
                value={input}
                onChange={handleInput}
                className={cx(
                    'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700',
                    className,
                )}
                rows={2}
                autoFocus
                onKeyDown={(event) => {
                    if (
                        event.key === 'Enter' &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                    ) {
                        event.preventDefault();

                        if (stillAnswering) {
                            toast.error('Please wait for the model to finish its response!');
                        } else {
                            submitForm();
                        }
                    }
                }}
            />

            <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
                <AttachmentsButton fileInputRef={fileInputRef} status={status}/>
            </div>

            <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                {stillAnswering ? (
                    <StopButton stop={stop} setMessages={setMessages}/>
                ) : (
                    <SendButton
                        input={input}
                        submitForm={submitForm}
                        uploadQueue={uploadQueue}
                    />
                )}
            </div>
        </div>
    );
}

export const MultimodalInput = memo(
    PureMultimodalInput,
    (prevProps, nextProps) => {
        if (prevProps.input !== nextProps.input) return false;
        if (prevProps.stillAnswering !== nextProps.stillAnswering) return false;
        if (prevProps.status !== nextProps.status) return false;
        if (prevProps.showSuggestedActions !== nextProps.showSuggestedActions) return false;
        return equal(prevProps.attachments, nextProps.attachments);
    },
);

function PureAttachmentsButton({
                                   fileInputRef,
                                   status,
                               }: {
    fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
    status: UseChatHelpers<ChatMessage>['status'];
}) {
    return (
        <Button
            data-testid="attachments-button"
            className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
            onClick={(event) => {
                event.preventDefault();
                fileInputRef.current?.click();
            }}
            disabled={status !== 'ready'}
            variant="ghost"
        >
            <PaperclipIcon size={14}/>
        </Button>
    );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
                            stop,
                            setMessages,
                        }: {
    stop: () => void;
    setMessages: UseChatHelpers<ChatMessage>['setMessages'];
}) {
    return (
        <Button
            data-testid="stop-button"
            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
            onClick={(event) => {
                event.preventDefault();
                stop();
                setMessages((messages) => messages);
            }}
        >
            <StopIcon size={14}/>
        </Button>
    );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
                            submitForm,
                            input,
                            uploadQueue,
                        }: {
    submitForm: () => void;
    input: string;
    uploadQueue: Array<string>;
}) {
    return (
        <Button
            data-testid="send-button"
            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
            onClick={(event) => {
                event.preventDefault();
                submitForm();
            }}
            disabled={input.length === 0 || uploadQueue.length > 0}
        >
            <ArrowUpIcon size={14}/>
        </Button>
    );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
    if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
        return false;
    return prevProps.input === nextProps.input;
});
