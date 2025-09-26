"use client";
import {Toaster} from 'sonner';
import {ThemeProvider} from '@/components/theme-provider';
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {AppSidebar} from "@/components/app-sidebar";
import {SidebarToggle} from "@/components/sidebar-toggle";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
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
    );
}

