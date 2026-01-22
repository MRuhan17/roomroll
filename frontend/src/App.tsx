import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { LobbyPage } from './pages/LobbyPage';
import { SessionRoomPage } from './pages/SessionRoomPage';
import { GlobalBackground } from './components/common/GlobalBackground';
import { Navigation } from './components/navigation/Navigation';
import { useState } from 'react';
import './App.css';

// Layout wrapper to inject Navigation and Background
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [isDarkerVariant, setIsDarkerVariant] = useState(false);

  return (
    <div className="relative min-h-screen">
      <GlobalBackground isDarker={isDarkerVariant} />

      <Navigation
        isDarkerVariant={isDarkerVariant}
        onVariantToggle={() => setIsDarkerVariant(!isDarkerVariant)}
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/" element={<DashboardPage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/session" element={<SessionRoomPage />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AuthProvider>
    </Router>
  );
}

export default App;
