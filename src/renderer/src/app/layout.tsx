'use client'
import ClientLayout from "@/app/client-layout";
import React from "react";
import "./globals.css";

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`antialiased`}>
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}
