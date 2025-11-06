'use client';

import {useRouter} from 'next/navigation';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem, useSidebar
} from '@/components/ui/sidebar';
import Link from 'next/link';
import {Home, SettingsIcon} from "lucide-react";

export function AppSidebar() {
    const context = useSidebar();
    useRouter();
    const menuItems = [
        {
            title: "Chat",
            url: "./",
            icon: Home,
        },
    ]
    return (
        <Sidebar className="group-data-[side=left]:border-r-0" collapsible="icon">
            {context.open && (
                <SidebarHeader>
                    <SidebarMenu>
                        <div className="flex flex-row justify-between items-center">
                            <Link
                                href="/"
                                className="flex flex-row gap-3 items-center"
                                onClick={e => e.preventDefault()}>
                          <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                            Cosmo
                          </span>
                            </Link>
                        </div>
                    </SidebarMenu>
                </SidebarHeader>
            )}
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon/>
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                            <Link href="./settings">
                                <SettingsIcon/>
                                <span>Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
