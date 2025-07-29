'use client'

import {UIMessage, useChat} from '@ai-sdk/react'
import {JSX, useState} from "react";
import {ipcChatTransport} from '@/chat-transport';

const initialMessages: UIMessage[] = [
    {
        id: '1',
        parts: [{
            type: 'text',
            text: 'Hello! How can I help you today?'
        }],
        role: 'assistant',
    },
]

export default function Page(): JSX.Element {
    return (
        <div className="flex h-screen flex-col">
            <header className="w-full border-b p-4 text-center">
                <h1 className="text-2xl font-bold">
                    Cosmo MCP
                </h1>
            </header>
            <div className="min-h-0 flex-1">
                <ChatExample/>
            </div>
        </div>
    )
}

function ChatExample() {
    const {messages, sendMessage} = useChat({
        transport: ipcChatTransport,
        messages: initialMessages
    })
    const [input, setInput] = useState('');

    return (
        <>
            {messages.map(message => (
                <div key={message.id}>
                    {message.role === 'user' ? 'User: ' : 'AI: '}
                    {message.parts.map((part, index) =>
                        part.type === 'text' ? <span key={index}>{part.text}</span> : null,
                    )}
                </div>
            ))}

            <form
                onSubmit={e => {
                    e.preventDefault();
                    if (input.trim()) {
                        sendMessage({text: input}).then(r => console.log(r));
                        setInput('');
                    }
                }}
            >
                <input
                    name="message"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Say something..."
                />
                <button type="submit">
                    Submit
                </button>
            </form>
        </>
    )
}