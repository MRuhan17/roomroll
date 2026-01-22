import React from 'react';
import { Link } from 'react-router-dom';
import { SignupForm } from '../components/auth/SignupForm';
import { AuthGuard } from '../components/auth/AuthGuard';
import { AuthLayout } from '../components/auth/AuthLayout';

export const SignupPage: React.FC = () => {
    return (
        <AuthGuard requireAuth={false}>
            <AuthLayout
                title="Sign the Registry"
                subtitle="Declare yourself to the guild masters"
            >
                <SignupForm />
                <p className="text-xs text-stone-500 text-center mt-6">
                    Already known? <Link to="/login" className="text-amber-800 hover:text-amber-600 font-medium hover:underline">Identify Yourself</Link>
                </p>
            </AuthLayout>
        </AuthGuard>
    );
};
