'use client'
import {JSX} from "react";
import {generateUUID} from "@/lib/utils";
import {Chat} from "@/components/chat";
import {DEFAULT_CHAT_MODEL} from "@/lib/models";


export default function Page(): JSX.Element {
    const id = generateUUID();
    return (
        <>
            <Chat
                key={id}
                id={id}
                initialMessages={[]}
                initialChatModel={DEFAULT_CHAT_MODEL}
            />
        </>
    );
}