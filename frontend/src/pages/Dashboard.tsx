import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/shared/Header';
import DiceTile from '../components/shared/DiceTile';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Determine which tiles to show based on role
  const showCharts = user?.role === 'admin' || user?.role === 'manager';
  const showTables = user?.role !== 'viewer';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
      <Header title="NHL Laboratory Dashboard" />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Chart Tiles - Only for Admin and Manager */}
          {showCharts && (
            <>
              <DiceTile to="/revenue" label="Revenue" type="chart" />
              <DiceTile to="/tests" label="Tests" type="chart" />
              <DiceTile to="/numbers" label="Numbers" type="chart" />
              <DiceTile to="/tat" label="TAT" type="chart" />
            </>
          )}

          {/* Table Tiles - For all except Viewer */}
          {showTables && (
            <>
              <DiceTile to="/reception" label="Reception" type="table" />
              <DiceTile to="/meta" label="Meta" type="table" />
              <DiceTile to="/progress" label="Progress" type="table" />
              <DiceTile to="/performance" label="Performance" type="table" />
              <DiceTile to="/tracker" label="Tracker" type="table" />
            </>
          )}

          {/* LRIDS - For all roles */}
          <DiceTile to="/lrids" label="LRIDS" type="display" />

          {/* Admin Panel - Only for Admin and Manager */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <DiceTile to="/admin" label="Admin Panel" type="table" />
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-primary/80 backdrop-blur-sm border-t border-highlight/20 py-4">
        <div className="container mx-auto px-4 flex justify-center">
          <img
            src="/images/zyntel_no_background.png"
            alt="Zyntel"
            className="h-8 opacity-60 hover:opacity-100 transition-opacity"
          />
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;