import { ContentPanel } from '../common/ContentPanel';
import { Scroll } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center px-6 pt-20">
            <ContentPanel className="w-full max-w-md p-8">
                <div className="flex flex-col items-center mb-6">
                    <Scroll className="w-12 h-12 text-amber-900 mb-3" />
                    <h1 className="text-2xl text-stone-800 tracking-wide text-center">{title}</h1>
                    <p className="text-sm text-stone-600 mt-1 text-center">{subtitle}</p>
                </div>
                {children}
            </ContentPanel>
        </div>
    );
}
