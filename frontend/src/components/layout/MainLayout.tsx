import { useState } from 'react';
import { GlobalBackground } from '../common/GlobalBackground';
import { Navigation } from '../navigation/Navigation';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [isDarkerVariant, setIsDarkerVariant] = useState(false);

    return (
        <div className="relative min-h-screen">
            <GlobalBackground isDarker={isDarkerVariant} />

            <Navigation
                isDarkerVariant={isDarkerVariant}
                onVariantToggle={() => setIsDarkerVariant(!isDarkerVariant)}
            />

            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
