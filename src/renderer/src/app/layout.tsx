'use client'
import ClientLayout from "@/app/client-layout";
import React from "react";
import "./globals.css";
import {inter} from "@/lib/fonts";

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${inter.variable} antialiased`}>
        <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
        </body>
        </html>
    );
}
