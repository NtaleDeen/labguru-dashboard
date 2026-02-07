import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Revenue from './pages/Revenue';
import Reception from './pages/Reception';
import Meta from './pages/Meta';
import LRIDS from './pages/LRIDS';
import Admin from './pages/Admin';
import Placeholder from './pages/Placeholder';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="loader">
          <div className="one"></div>
          <div className="two"></div>
          <div className="three"></div>
          <div className="four"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/revenue"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Revenue />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tests"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Placeholder title="Tests" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/numbers"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Placeholder title="Numbers" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tat"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Placeholder title="TAT" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reception"
        element={
          <ProtectedRoute>
            <Reception />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meta"
        element={
          <ProtectedRoute>
            <Meta />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute>
            <Placeholder title="Progress Table" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <Placeholder title="Performance Table" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracker"
        element={
          <ProtectedRoute>
            <Placeholder title="Tracker Table" />
          </ProtectedRoute>
        }
      />
      <Route path="/lrids" element={<LRIDS />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;