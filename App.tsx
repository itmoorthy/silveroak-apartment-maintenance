
import React, { useState, useEffect } from 'react';
import { AuthState, User, UserRole } from './types';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ResidentDashboard from './pages/ResidentDashboard';
import ManageFlats from './pages/ManageFlats';
import BillingPage from './pages/BillingPage';
import ComplaintPage from './pages/ComplaintPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  useEffect(() => {
    const savedUser = localStorage.getItem('silveroak_auth_session');
    if (savedUser) {
      setAuth({ user: JSON.parse(savedUser), isAuthenticated: true });
    }
  }, []);

  const handleLogin = (user: User) => {
    setAuth({ user, isAuthenticated: true });
    localStorage.setItem('silveroak_auth_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem('silveroak_auth_session');
    setCurrentPage('dashboard');
  };

  if (!auth.isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return auth.user?.role === UserRole.ADMIN ? <AdminDashboard /> : <ResidentDashboard user={auth.user!} />;
      case 'flats':
        return auth.user?.role === UserRole.ADMIN ? <ManageFlats /> : <ResidentDashboard user={auth.user!} />;
      case 'billing':
        return <BillingPage user={auth.user!} />;
      case 'complaints':
        return <ComplaintPage user={auth.user!} />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        role={auth.user?.role || UserRole.RESIDENT} 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
      />
      <div className="flex-1 flex flex-col">
        <Header user={auth.user!} onLogout={handleLogout} />
        <main className="flex-1 p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
