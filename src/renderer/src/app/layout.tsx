import {Toaster} from 'sonner';
import {ThemeProvider} from '@/components/theme-provider';

import "./globals.css";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {AppSidebar} from "@/components/app-sidebar";
import {cookies} from "next/headers";

export default async function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    const cookieStore = await cookies();
    const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`antialiased`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <SidebarProvider defaultOpen={!isCollapsed}>
                <AppSidebar/>
                <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
            <Toaster position="top-center"/>
        </ThemeProvider>
        </body>
        </html>
    );
}
