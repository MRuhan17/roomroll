import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

  // Check for existing session (mock)
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      await delay(500); 
      // For Phase 1, we start unauthenticated.
      // In a real app, we'd check localStorage or an auth token here.
      setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await delay(1000); // Simulate API call
      
      // Basic validation mock
      if (!email.includes('@')) {
        throw new Error('Invalid email address');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Mock success
      const mockUser: User = {
        id: 'user_123',
        email,
        name: email.split('@')[0],
      };
      setUser(mockUser);
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
      await delay(1000);
      
      if (!email.includes('@')) throw new Error('Invalid email address');
      if (password.length < 6) throw new Error('Password must be at least 6 characters');

      const mockUser: User = {
        id: 'user_456',
        email,
        name: email.split('@')[0],
      };
      setUser(mockUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
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
