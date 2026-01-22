import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

export const AuthScreen: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md bg-stone-900/90 border-amber-900/30 text-stone-200">
                <CardHeader>
                    <CardTitle className="text-2xl text-center text-amber-500 font-serif">
                        {isLogin ? 'Welcome Back' : 'Join the Guild'}
                    </CardTitle>
                    <CardDescription className="text-center text-stone-400">
                        {isLogin ? 'Enter your credentials to continue' : 'Create an account to start your journey'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLogin ? <LoginForm /> : <SignupForm />}

                    <div className="mt-6 text-center text-sm">
                        <span className="text-stone-500">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                        >
                            {isLogin ? 'Sign up' : 'Login'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
