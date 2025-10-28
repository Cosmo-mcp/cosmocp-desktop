"use client";
import {ModelSelector} from "@/components/model-selector";
import {ModeToggle} from "@/components/mode-toggle";
import * as React from "react";
import {useState} from "react";

export default function SettingsPage() {

    const [resolvedTheme, setResolvedTheme] = useState<string | undefined>('dark');

    return (
        <main className="flex-1 p-6 md:p-8">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold">Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                    Configure your provider, pick a model, and choose theme preferences.
                </p>
            </header>

            <div className="w-full max-w-[920px] mx-auto">
                <section className="flex flex-col items-center md:flex-row md:justify-center gap-4 md:gap-6">
                    <div
                        className="bg-card border rounded-lg p-4 shadow-sm w-full md:w-[440px] flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h2 className="text-lg font-medium">Model & Provider</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Select or add a provider, then pick a model to use.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-2">
                                <ModelSelector selectedModelId={""} className="w-full"/>
                            </div>
                        </div>
                    </div>

                    <div
                        className="bg-card border rounded-lg p-4 shadow-sm w-full md:w-[440px] flex flex-col justify-between">
                        <div>
                            <h2 className="text-lg font-medium">Appearance</h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                Switch between Light, Dark, or follow your system preference.
                            </p>
                        </div>

                        <div className="mt-4 flex items-center justify-start">
                            <ModeToggle onResolvedThemeChange={setResolvedTheme}/>
                            <span className="ml-3 capitalize">{resolvedTheme}</span>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
