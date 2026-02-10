import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ContentPanel } from './ContentPanel';
import { Scroll } from 'lucide-react';

export function AuthScreen() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (localStorage.getItem('dnd_authenticated') === 'true') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication - just check if fields are filled
    if (username && password) {
      localStorage.setItem('dnd_authenticated', 'true');
      localStorage.setItem('dnd_username', username);
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <ContentPanel className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <Scroll className="w-12 h-12 text-amber-900 mb-3" />
          <h1 className="text-2xl text-stone-800 tracking-wide">Enter the Guild</h1>
          <p className="text-sm text-stone-600 mt-1">Sign in to continue your journey</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Username</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-800/50"
            />
          </div>

          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-800/50"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-amber-900 hover:bg-amber-800 text-amber-50 rounded transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!username || !password}
          >
            Enter
          </button>
        </form>

        <p className="text-xs text-stone-500 text-center mt-6">
          New to the guild? Speak with the keeper to register.
        </p>
      </ContentPanel>
    </div>
  );
}
