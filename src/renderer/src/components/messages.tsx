import {memo, useEffect, useRef, useState} from 'react';
import equal from 'fast-deep-equal';
import type {UseChatHelpers} from '@ai-sdk/react';
import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton
} from './ai-elements/conversation';
import {
    Message,
    MessageAction,
    MessageActions,
    MessageContent,
    MessageResponse
} from "@/components/ai-elements/message";
import {CopyIcon, MessageSquare} from "lucide-react";
import {Reasoning, ReasoningContent, ReasoningTrigger} from "@/components/ai-elements/reasoning";
import {Source, Sources, SourcesContent, SourcesTrigger} from "@/components/ai-elements/sources";
import {Loader} from "@/components/ai-elements/loader";
import {UIMessage} from "ai";
import {PreviewAttachment} from "@/components/preview-attachment";


interface MessagesProps {
    chatId: string;
    status: UseChatHelpers<UIMessage>['status'];
    messages: UIMessage[];
    regenerate: UseChatHelpers<UIMessage>['regenerate'];
    searchQuery?: string;
    currentMatchIndex?: number;
    onMatchesFound?: (count: number) => void;
}

function PureMessages({
                          status,
                          messages,
                          regenerate,
                          searchQuery,
                          currentMatchIndex,
                          onMatchesFound
                      }: MessagesProps) {
    const [matches, setMatches] = useState<{ messageId: string, partIndex: number }[]>([]);
    const [matchStartIndexMap, setMatchStartIndexMap] = useState<Record<string, number>>({});
    const prevMatchIndexRef = useRef<number | null>(null);

    useEffect(() => {
        if (!searchQuery) {
            setMatches([]);
            setMatchStartIndexMap({});
            if (onMatchesFound) onMatchesFound(0);
            return;
        }

        const newMatches: { messageId: string, partIndex: number }[] = [];
        const newMatchStartIndexMap: Record<string, number> = {};

        messages.forEach(m => {
            m.parts.forEach((p, pIndex) => {
                if (p.type === 'text') {
                    const text = p.text.toLowerCase();
                    const query = searchQuery.toLowerCase();
                    let startIndex = 0;
                    let index;

                    const partKey = `${m.id}-${pIndex}`;
                    newMatchStartIndexMap[partKey] = newMatches.length;

                    while ((index = text.indexOf(query, startIndex)) > -1) {
                        newMatches.push({messageId: m.id, partIndex: pIndex});
                        startIndex = index + query.length;
                    }
                }
            });
        });

        setMatches(newMatches);
        setMatchStartIndexMap(newMatchStartIndexMap);
        if (onMatchesFound) onMatchesFound(newMatches.length);
    }, [searchQuery, messages, onMatchesFound]);

    useEffect(() => {
        // Reset previous match style
        if (prevMatchIndexRef.current !== null) {
            const prevIndex = prevMatchIndexRef.current - 1;
            const prevEl = document.getElementById(`match-${prevIndex}`);
            if (prevEl) {
                prevEl.style.backgroundColor = '#fef08a';
                prevEl.style.color = 'black';
            }
        }

        if (currentMatchIndex && currentMatchIndex > 0 && currentMatchIndex <= matches.length) {
            const matchIndex = currentMatchIndex - 1;
            
            // We need a small delay to allow render to update the DOM with new IDs if search query changed
            setTimeout(() => {
                const matchElement = document.getElementById(`match-${matchIndex}`);
                if (matchElement) {
                    matchElement.scrollIntoView({behavior: 'smooth', block: 'center'});
                    matchElement.style.backgroundColor = '#f97316';
                    matchElement.style.color = 'white';
                    prevMatchIndexRef.current = currentMatchIndex;
                } else {
                    // Fallback to message scrolling if specific match element not found
                    const match = matches[matchIndex];
                    if (match) {
                        const elementId = `message-${match.messageId}-part-${match.partIndex}`;
                        const element = document.getElementById(elementId);
                        if (element) {
                            element.scrollIntoView({behavior: 'smooth', block: 'center'});
                            element.classList.add('bg-muted');
                            setTimeout(() => element.classList.remove('bg-muted'), 2000);
                        }
                    }
                }
            }, 100);
        } else {
            prevMatchIndexRef.current = null;
        }
    }, [currentMatchIndex, matches]);

    const highlightText = (text: string, query: string, messageId: string, partIndex: number) => {
        if (!query) return text;
        const partKey = `${messageId}-${partIndex}`;
        const startIndex = matchStartIndexMap[partKey];
        if (startIndex === undefined) return text;

        try {
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(${escapedQuery})`, 'gi');

            let matchCount = 0;
            return text.replace(regex, (match) => {
                const globalIndex = startIndex + matchCount;
                matchCount++;
                // Always render as default match initially. Active match is handled by useEffect via DOM manipulation.
                const style = "background-color: #fef08a; color: black;";
                return `<mark id="match-${globalIndex}" style="${style}">${match}</mark>`;
            });
        } catch (e) {
            console.error("Error highlighting text", e);
            return text;
        }
    };

    return (
        <Conversation>
            <ConversationContent>
                {messages.length === 0 ? (
                    <ConversationEmptyState
                        icon={<MessageSquare className="size-12"/>}
                        title="Start a conversation"
                        description="Type a message below to begin chatting"
                    />
                ) : (
                    messages.map((message) => {
                        return (
                            <div key={message.id}>
                                {/* Render reasoning parts first */}
                                {message.role === 'assistant' && (() => {
                                    const reasoningParts = message.parts.filter(part => part.type === 'reasoning');
                                    if (reasoningParts.length === 0) return null;
                                    
                                    const hasTextContent = message.parts.some(p => p.type === 'text' && p.text.length > 0);
                                    const isReasoningStreaming = status === 'streaming' && !hasTextContent;

                                    return reasoningParts.map((part, i) => (
                                        <Reasoning
                                            key={`${message.id}-reasoning-${i}`}
                                            className="w-full"
                                            isStreaming={isReasoningStreaming}
                                        >
                                            <ReasoningTrigger />
                                            <ReasoningContent>{part.text}</ReasoningContent>
                                        </Reasoning>
                                    ));
                                })()}
                                {/* Render sources */}
                                {message.role === 'assistant' && message.parts.filter(part => part.type === 'source-url').length > 0 && (
                                    <Sources>
                                        <SourcesTrigger
                                            count={
                                                message.parts.filter(
                                                    (part) => part.type === 'source-url',
                                                ).length
                                            }
                                        />
                                        {message.parts.filter((part) => part.type === 'source-url').map((part, idx) => (
                                            <SourcesContent key={`${message.id}-source-${idx}`}>
                                                <Source
                                                    key={`${message.id}-source-${idx}`}
                                                    href={part.url}
                                                    title={part.url}
                                                />
                                            </SourcesContent>
                                        ))}
                                    </Sources>
                                )}
                                {/* Render other parts (text, file, etc.) */}
                                {message.parts.map((part, i) => {
                                    switch (part.type) {
                                        case 'text':
                                            return (
                                                <Message
                                                    key={`${message.id}-${i}`}
                                                    from={message.role}
                                                    id={`message-${message.id}-part-${i}`}
                                                >
                                                    <MessageContent>
                                                        <MessageResponse key={searchQuery}>
                                                            {highlightText(part.text, searchQuery || '', message.id, i)}
                                                        </MessageResponse>
                                                    </MessageContent>
                                                    {message.role === 'assistant' && (
                                                        <MessageActions>
                                                            {/*<MessageAction
                                                                onClick={() => regenerate()}
                                                                label="Retry"
                                                            >
                                                                <RefreshCcwIcon className="size-3"/>
                                                            </MessageAction>*/}
                                                            <MessageAction
                                                                onClick={() =>
                                                                    navigator.clipboard.writeText(part.text)
                                                                }
                                                                label="Copy"
                                                            >
                                                                <CopyIcon className="size-3" />
                                                            </MessageAction>
                                                        </MessageActions>
                                                    )}
                                                </Message>
                                            );
                                        case 'file':
                                            return (
                                                <div key={`${message.id}-${i}`} className="flex flex-row justify-end gap-2 m-2">
                                                    <PreviewAttachment
                                                        attachment={{
                                                            name: part.filename ?? "file",
                                                            contentType: part.mediaType,
                                                            url: part.url,
                                                        }}
                                                    />
                                                </div>
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </div>
                        );
                    }))}
                {status === 'submitted' &&
                    <div className="self-start">
                        <Loader/>
                    </div>}
            </ConversationContent>
            <ConversationScrollButton/>
        </Conversation>
    );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
    if (prevProps.searchQuery !== nextProps.searchQuery) return false;
    if (prevProps.currentMatchIndex !== nextProps.currentMatchIndex) return false;
    if (prevProps.status !== nextProps.status) return false;

    // Always re-render when streaming to ensure token updates are reflected immediately
    if (nextProps.status === 'streaming') return false;

    // Use deep comparison for static states to avoid unnecessary re-renders
    return equal(prevProps.messages, nextProps.messages);
});
