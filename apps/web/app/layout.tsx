import { Inter } from 'next/font/google';
import '@workspace/ui/globals.css';
import { ThemeProvider } from '@/src/components/theme-provider';
import { cn } from '@workspace/ui/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning className={cn('antialiased', inter.variable, 'font-sans')}>
            <body>
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
