'use client';

import {useRouter} from 'next/navigation';

import {MoreIcon, PlusIcon} from '@/components/icons';
import {Button} from '@/components/ui/button';
import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu} from '@/components/ui/sidebar';
import Link from 'next/link';

export function AppSidebar() {
    const router = useRouter();
    return (
        <Sidebar className="group-data-[side=left]:border-r-0">
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
                    <Button
                        variant="ghost"
                        type="button"
                        className="p-2 m-2 h-fit border-2 border-solid"
                        onClick={() => {
                            router.push('/');
                        }}>
                        <PlusIcon/>
                        New Chat
                    </Button>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {/*<SidebarHistory user={user} />*/}
            </SidebarContent>
            <SidebarFooter>
                <Button
                    variant="ghost"
                    type="button"
                    className="p-2 m-2 h-fit border-2 border-solid"
                    onClick={() => {
                        router.push('/settings');
                    }}>
                    <MoreIcon/>
                    Settings
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
}
