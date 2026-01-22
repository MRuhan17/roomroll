import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationProps {
    isDarkerVariant: boolean;
    onVariantToggle: () => void;
}

export function Navigation({ isDarkerVariant, onVariantToggle }: NavigationProps) {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', requiredAuth: true },
        { path: '/lobby', label: 'Lobby', requiredAuth: true },
        { path: '/session', label: 'Session Room', requiredAuth: true },
        { path: '/login', label: 'Login', requiredAuth: false, hideIfAuth: true },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex gap-2">
                    {navItems.map((item) => {
                        if (item.requiredAuth && !isAuthenticated) return null;
                        if (item.hideIfAuth && isAuthenticated) return null;

                        const isActive = location.pathname === item.path;

                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
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
