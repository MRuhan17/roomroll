import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAuth();
    // navigate is handled by AuthGuard usually, but we keep the form pure.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(email, password);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm text-stone-700 mb-1.5" htmlFor="email">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mage@guild.com"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-800/50 transition-all"
                />
            </div>

            <div>
                <label className="block text-sm text-stone-700 mb-1.5" htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-800/50 transition-all"
                />
            </div>

            {error && <div className="text-red-700 text-sm bg-red-50 p-2 rounded border border-red-200">{error}</div>}

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 bg-amber-900 hover:bg-amber-800 text-amber-50 rounded transition-colors mt-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                {isLoading ? 'Consulting the Archives...' : 'Identify Self'}
            </button>
        </div>
    );
};
