'use client';

import {SlashCommandManagement} from "@/components/slash-command-management";

// Provide a dedicated sidebar destination for command management.
export default function SlashCommandsPage() {
    return (
        <div className="flex h-full w-full flex-col p-4">
            <SlashCommandManagement/>
        </div>
    );
}
