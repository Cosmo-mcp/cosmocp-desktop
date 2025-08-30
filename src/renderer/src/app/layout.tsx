import {Toaster} from 'sonner';
import {ThemeProvider} from '@/components/theme-provider';

import "./globals.css";

export default function RootLayout({
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
            <Toaster position="top-center"/>
            {children}
        </ThemeProvider>
        </body>
        </html>
    );
}
