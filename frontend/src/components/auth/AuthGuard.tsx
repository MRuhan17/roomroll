import React from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AuthGuardProps {
    children: ReactNode;
    requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading access permissions...</div>;
    }

    // Logic for redirection should be handled by the parent/router state
    if (requireAuth && !isAuthenticated) {
        return <div className="p-8 text-center text-red-400">Authentication Required</div>;
    }

    if (!requireAuth && isAuthenticated) {
        // return <div className="p-8 text-center">Already Authenticated</div>;
    }

    return <>{children}</>;
};
