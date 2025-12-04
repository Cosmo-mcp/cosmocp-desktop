'use client'
import React from "react";
import "./globals.css";
import {inter} from "@/lib/fonts";
import {ThemeProvider} from "next-themes";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {AppSidebar} from "@/components/app-sidebar";
import {Toaster} from "sonner";
import {SiteHeader} from "@/components/site-header";

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} antialiased`}>
        <body className={inter.className}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
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
            </SidebarProvider>
            <Toaster position="top-center"/>
        </ThemeProvider>
        </body>
        </html>
    );
}
