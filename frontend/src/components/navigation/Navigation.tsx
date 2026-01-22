import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavigationProps {
    currentPage: 'auth' | 'dashboard' | 'lobby' | 'session';
    onPageChange: (page: 'auth' | 'dashboard' | 'lobby' | 'session') => void;
    isDarkerVariant: boolean;
    onVariantToggle: () => void;
}

export function Navigation({ currentPage, onPageChange, isDarkerVariant, onVariantToggle }: NavigationProps) {
    const { isAuthenticated, logout } = useAuth();

    type NavItem = {
        id: 'auth' | 'dashboard' | 'lobby' | 'session';
        label: string;
        requiredAuth: boolean;
        hideIfAuth?: boolean;
    };

    const navItems: NavItem[] = [
        { id: 'dashboard', label: 'Dashboard', requiredAuth: true },
        { id: 'lobby', label: 'Lobby', requiredAuth: true },
        { id: 'session', label: 'Session Room', requiredAuth: true },
        { id: 'auth', label: 'Login', requiredAuth: false, hideIfAuth: true },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex gap-2">
                    {navItems.map((item) => {
                        if (item.requiredAuth && !isAuthenticated) return null;
                        if (item.hideIfAuth && isAuthenticated) return null;

                        const isActive = currentPage === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onPageChange(item.id)}
                                className={`px-4 py-2 rounded transition-all ${isActive
                                    ? 'bg-amber-900/40 text-amber-100 border border-amber-700/50'
                                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/30'
                                    }`}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onVariantToggle}
                        className="px-4 py-2 rounded bg-stone-800/40 text-stone-300 hover:bg-stone-700/50 border border-stone-600/30 flex items-center gap-2 transition-all"
                        title={isDarkerVariant ? 'Switch to Standard' : 'Switch to Darker'}
                    >
                        {isDarkerVariant ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        <span className="text-sm hidden sm:inline">{isDarkerVariant ? 'Standard' : 'Darker'}</span>
                    </button>

                    {isAuthenticated && (
                        <button
                            onClick={logout}
                            className="px-4 py-2 rounded bg-stone-800/40 text-stone-300 hover:bg-red-900/30 border border-stone-600/30 transition-all text-sm"
                        >
                            Depart
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
