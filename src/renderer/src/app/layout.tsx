'use client'
import React from "react";
import "./globals.css";
import {ThemeProvider} from "next-themes";
import {Toaster} from "sonner";

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <body>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <Toaster position="top-center"/>
        </ThemeProvider>
        </body>
    );
}
