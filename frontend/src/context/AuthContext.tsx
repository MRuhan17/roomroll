import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Types
interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock delay to simulate network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      // Simulate checking a fast local store or valid token
      await delay(500);

      try {
        const storedUser = localStorage.getItem('roomroll_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to parse user from storage", error);
        localStorage.removeItem('roomroll_user');
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with real API call
      await delay(800); // Simulate network latency

      // Basic validation
      if (!email.includes('@')) {
        throw new Error('Invalid email address');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Simulate successful login response
      const user: User = {
        id: crypto.randomUUID(),
        email,
        name: email.split('@')[0],
      };

      localStorage.setItem('roomroll_user', JSON.stringify(user));
      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with real API call
      await delay(800);

      if (!email.includes('@')) throw new Error('Invalid email address');
      if (password.length < 6) throw new Error('Password must be at least 6 characters');

      const user: User = {
        id: crypto.randomUUID(),
        email,
        name: email.split('@')[0],
      };

      localStorage.setItem('roomroll_user', JSON.stringify(user));
      setUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('roomroll_user');
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      signup,
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
