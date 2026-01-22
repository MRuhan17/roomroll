import React from 'react';
import { Link } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { AuthGuard } from '../components/auth/AuthGuard';
import { AuthLayout } from '../components/auth/AuthLayout';

export const LoginPage: React.FC = () => {
    return (
        <AuthGuard requireAuth={false}>
            <AuthLayout
                title="Enter the Guild"
                subtitle="Sign in to continue your journey"
            >
                <LoginForm />
                <p className="text-xs text-stone-500 text-center mt-6">
                    New to the guild? <Link to="/signup" className="text-amber-800 hover:text-amber-600 font-medium hover:underline">Speak with the keeper to register.</Link>
                </p>
            </AuthLayout>
        </AuthGuard>
    );
};
