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
import TAT from './pages/TAT';
import Tests from './pages/Tests';
import Numbers from './pages/Numbers';
import Tracker from './pages/Tracker';
import Progress from './pages/Progress';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
            <Tests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/numbers"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Numbers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tat"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <TAT />
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
            <Progress />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracker"
        element={
          <ProtectedRoute>
            <Tracker />
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