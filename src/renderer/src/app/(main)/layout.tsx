'use client'
import React from "react";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {AppSidebar} from "@/components/app-sidebar";
import {SiteHeader} from "@/components/site-header";
import {Toaster} from "sonner";

export default function MainLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
            <SidebarProvider
                style={{
                    "--sidebar-width-icon": "3rem",
                    "--header-height": "calc(var(--spacing) * 14)",
                } as React.CSSProperties}>
                <AppSidebar/>
                <SidebarInset>
                    <SiteHeader/>
                    <div className="flex flex-1 flex-col h-full w-full">
                        <div className="@container/main flex flex-1 flex-col h-full w-full">
                            {children}
                        </div>
                    </div>
                </SidebarInset>
                <Toaster position="top-center"/>
            </SidebarProvider>
    );
}

