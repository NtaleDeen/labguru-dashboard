import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/authcontext';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/login';
import Dashboard from './pages/Dashboard';
import AdminUsers from './pages/AdminUsers';
import Layout from './components/Layout/Layout';

const PrivateRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ 
  children, 
  roles 
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
      
      <Route element={<Layout />}>
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute roles={['manager']}>
              <AdminUsers />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;