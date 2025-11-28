"use client";
import {ModeToggle} from "@/components/mode-toggle";
import {ProviderManagement} from "@/components/provider-management";
import * as React from "react";
import {useState} from "react";
import {SiteFooter} from "@/components/site-footer";

export default function SettingsPage() {

    const [resolvedTheme, setResolvedTheme] = useState<string | undefined>('dark');

    return (
        <main className="flex-1 p-6 md:p-8">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Settings</h1>
                    <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                        Configure your provider, pick a model
                    </p>
                </div>
            </header>

            <div className="w-full max-w-[520px] space-y-8">
                <section className="bg-card border rounded-lg p-6 shadow-sm">
                    <ProviderManagement/>
                </section>
            </div>
            <SiteFooter/>
        </main>
    );
}
