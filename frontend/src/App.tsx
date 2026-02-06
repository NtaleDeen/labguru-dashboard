import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { AuthService } from './utils/auth';
import { api } from './utils/api';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Revenue from './pages/Revenue';
import MetaTable from './pages/MetaTable';
import Reception from './pages/Reception';
import LRIDS from './pages/LRIDS';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';

// Protected route component
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!AuthService.isAuthenticated()) {
        window.location.href = '/login';
        return;
      }

      if (requiredRole && !AuthService.hasRole([requiredRole])) {
        setIsAuthorized(false);
      } else {
        setIsAuthorized(true);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

// Public route component
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  if (AuthService.isAuthenticated()) {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#10b981',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/revenue" element={
            <ProtectedRoute requiredRole="manager">
              <Layout>
                <Revenue />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/meta" element={
            <ProtectedRoute>
              <Layout>
                <MetaTable />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/reception" element={
            <ProtectedRoute requiredRole="technician">
              <Layout>
                <Reception />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/lrids" element={
            <ProtectedRoute>
              <Layout>
                <LRIDS />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <Layout>
                <AdminPanel />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;