'use client'
import React from "react";
import "./globals.css";
import {inter} from "@/lib/fonts";
import {ThemeProvider} from "next-themes";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {AppSidebar} from "@/components/app-sidebar";
import {SidebarToggle} from "@/components/sidebar-toggle";
import {Toaster} from "sonner";

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
            <SidebarProvider defaultOpen={true}>
                <AppSidebar/>
                <SidebarToggle/>
                <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
            <Toaster position="top-center"/>
        </ThemeProvider>
        </body>
        </html>
    );
}
