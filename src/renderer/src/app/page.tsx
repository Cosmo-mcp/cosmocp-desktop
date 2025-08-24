'use client'
import {JSX} from "react";
import {generateUUID} from "@/lib/utils";
import {Chat} from "@/components/chat";

export default function Page(): JSX.Element {
    const id = generateUUID();
    return (
        <>
            <Chat
                key={id}
                id={id}
                initialMessages={[]}
                initialChatModel=''
            />
        </>
    );
}