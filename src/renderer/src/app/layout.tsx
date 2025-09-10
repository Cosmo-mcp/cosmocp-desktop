import {Toaster} from 'sonner';
import {ThemeProvider} from '@/components/theme-provider';

import "./globals.css";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {AppSidebar} from "@/components/app-sidebar";

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`antialiased`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <SidebarProvider defaultOpen={true}>
                <AppSidebar/>
                <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
            <Toaster position="top-center"/>
        </ThemeProvider>
        </body>
        </html>
    );
}
