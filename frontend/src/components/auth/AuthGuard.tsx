import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AuthGuardProps {
    children: ReactNode;
    requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAuth = true }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div>Loading access permissions...</div>;
    }

    // If page requires auth and user is not authenticated -> Redirect to Login
    if (requireAuth && !isAuthenticated) {
        // Save the location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If page is for guests only (like Login/Signup) and user IS authenticated -> Redirect to Dashboard
    if (!requireAuth && isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
