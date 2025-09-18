'use client';

import type {UIMessage} from 'ai';
import {
    type ChangeEvent,
    type Dispatch,
    memo,
    type SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {toast} from 'sonner';
import {useLocalStorage, useWindowSize} from 'usehooks-ts';

import {ArrowUpIcon, PaperclipIcon, StopIcon,} from './icons';
import {PreviewAttachment} from './preview-attachment';
import {Button} from './ui/button';
import {SuggestedActions} from './suggested-actions';
import {
    PromptInput,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
} from './ai-elements/prompt-input';
import equal from 'fast-deep-equal';
import type {UseChatHelpers} from '@ai-sdk/react';
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
                                 selectedModelId,
                                 showSuggestedActions,
                                 stillAnswering,
                                 setForceScrollToBottom
                             }: {
    chatId: string;
    input: string;
    setInput: Dispatch<SetStateAction<string>>;
    status: UseChatHelpers<ChatMessage>['status'];
    stop: () => void;
    attachments: Array<Attachment>;
    setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
    messages: Array<UIMessage>;
    setMessages: UseChatHelpers<ChatMessage>['setMessages'];
    sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
    className?: string;
    showSuggestedActions?: boolean,
    stillAnswering?: boolean,
    setForceScrollToBottom?: Dispatch<SetStateAction<boolean>>
    selectedModelId: string;
    onModelChange?: (modelId: string) => void;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const {width} = useWindowSize();

    useEffect(() => {
        if (textareaRef.current) {
            adjustHeight();
        }
    }, []);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '44px';
        }
    };

    const resetHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '44px';
        }
    };

    const [localStorageInput, setLocalStorageInput] = useLocalStorage(
        'input',
        '',
    );

    useEffect(() => {
        if (textareaRef.current) {
            const domValue = textareaRef.current.value;
            // Prefer DOM value over localStorage to handle hydration
            const finalValue = domValue || localStorageInput || '';
            setInput(finalValue);
            adjustHeight();
        }
        // Only run once after hydration
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setLocalStorageInput(input);
    }, [input, setLocalStorageInput]);

    const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(event.target.value);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

    const submitForm = useCallback(() => {
        window.history.replaceState({}, '', `/chat/${chatId}`);

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
            // TODO: use if reqd
        }).catch((error) => {
            toast.error(error.message);
            // TODO: use if reqd
        }).finally(() => {
            // TODO: use if reqd
        })

        setAttachments([]);
        setLocalStorageInput('');
        resetHeight();
        setInput('');

        // reset scroll on form submit
        if (setForceScrollToBottom) {
            setForceScrollToBottom(false);
        }

        if (width && width > 768) {
            textareaRef.current?.focus();
        }
    }, [chatId, sendMessage, attachments, input, setAttachments, setLocalStorageInput, setInput, setForceScrollToBottom, width]);

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

    return (
        <div className="flex relative flex-col gap-4 w-full">
            {showSuggestedActions &&
                uploadQueue.length === 0 && (
                    <SuggestedActions
                        sendMessage={sendMessage}
                        chatId={chatId}
                    />
                )}

            <input
                type="file"
                className="-top-4 -left-4 pointer-events-none fixed size-0.5 opacity-0"
                ref={fileInputRef}
                multiple
                onChange={handleFileChange}
                tabIndex={-1}
            />

            <PromptInput
                className="p-3 rounded-xl border transition-all duration-200 border-border bg-background shadow-xs focus-within:border-border hover:border-muted-foreground/50"
                onSubmit={(_, event) => {
                    event.preventDefault();
                    if (stillAnswering) {
                        toast.error('Please wait for the model to finish its response!');
                    } else {
                        submitForm();
                    }
                }}
            >
                {(attachments.length > 0 || uploadQueue.length > 0) && (
                    <div
                        data-testid="attachments-preview"
                        className="flex overflow-x-scroll flex-row gap-2 items-end"
                    >
                        {attachments.map((attachment) => (
                            <PreviewAttachment
                                key={attachment.url}
                                attachment={attachment}
                                onRemove={() => {
                                    setAttachments((currentAttachments) =>
                                        currentAttachments.filter((a) => a.url !== attachment.url),
                                    );
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                            />
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
                <div className="flex flex-row gap-1 items-start sm:gap-2">
                    <PromptInputTextarea
                        data-testid="multimodal-input"
                        ref={textareaRef}
                        placeholder="Send a message..."
                        value={input}
                        onChange={handleInput}
                        minHeight={44}
                        maxHeight={200}
                        disableAutoResize={true}
                        className="grow resize-none border-0! p-2 border-none! bg-transparent text-sm outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden"
                        rows={1}
                        autoFocus
                    />{' '}
                </div>
                <PromptInputToolbar
                    className="!border-top-0 border-t-0! p-0 shadow-none dark:border-0 dark:border-transparent!">
                    <PromptInputTools className="gap-0 sm:gap-0.5">
                        <AttachmentsButton
                            fileInputRef={fileInputRef}
                            status={status}
                            selectedModelId={selectedModelId}
                        />
                    </PromptInputTools>

                    {stillAnswering ? (
                        <StopButton stop={stop} setMessages={setMessages}/>
                    ) : (
                        <PromptInputSubmit
                            status={status}
                            disabled={!input.trim() || uploadQueue.length > 0}
                            className="rounded-full transition-colors duration-200 size-8 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                        >
                            <ArrowUpIcon size={14}/>
                        </PromptInputSubmit>
                    )}
                </PromptInputToolbar>
            </PromptInput>
        </div>
    );
}

export const MultimodalInput = memo(
    PureMultimodalInput,
    (prevProps, nextProps) => {
        if (prevProps.input !== nextProps.input) return false;
        if (prevProps.stillAnswering !== nextProps.stillAnswering) return false;
        if (prevProps.status !== nextProps.status) return false;
        if (!equal(prevProps.attachments, nextProps.attachments)) return false;
        if (prevProps.showSuggestedActions !== nextProps.showSuggestedActions) return false;
        return prevProps.selectedModelId === nextProps.selectedModelId;

    },
);

function PureAttachmentsButton({
                                   fileInputRef,
                                   status,
                                   selectedModelId,
                               }: {
    fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
    status: UseChatHelpers<ChatMessage>['status'];
    selectedModelId: string;
}) {
    const isReasoningModel = selectedModelId === 'chat-model-reasoning';

    return (
        <Button
            data-testid="attachments-button"
            className="p-1 h-8 rounded-lg transition-colors aspect-square hover:bg-accent"
            onClick={(event) => {
                event.preventDefault();
                fileInputRef.current?.click();
            }}
            disabled={status !== 'ready' || isReasoningModel}
            variant="ghost"
        >
            <PaperclipIcon size={14} style={{width: 14, height: 14}}/>
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
            className="p-1 rounded-full transition-colors duration-200 size-7 bg-foreground text-background hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground"
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
