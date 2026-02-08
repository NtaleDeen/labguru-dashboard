import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const showCharts = user?.role === 'admin' || user?.role === 'manager';
  const showTables = user?.role !== 'viewer';

  return (
    <div className="dashboard-page">
      <header>
        <div className="header-container">
          <div className="header-left">
            <div className="logo">
              <img src="/images/logo-nakasero.png" alt="logo" />
            </div>
            <h1>NHL Laboratory Dashboard</h1>
          </div>
          <div className="page">
            <span>Home</span>
            <a href="#" className="logout-button" id="logout-button">Logout</a>
            <span className="three-dots-menu-container">
              <button className="three-dots-button">&#x22EE;</button>
              <ul className="dropdown-menu">
                <li><a href="/dashboard">Dashboard</a></li>
                <li><a href="/revenue">Revenue</a></li>
                <li><a href="/reception">Reception</a></li>
                <li><a href="/meta">Meta</a></li>
                <li><a href="/admin">Admin Panel</a></li>
              </ul>
            </span>
          </div>
        </div>
      </header>

      <div className="main-container">
        <div className="dice-grid">
          {/* Chart Tiles - Only for Admin and Manager */}
          {showCharts && (
            <>
              <a href="/revenue" className="dice-tile" data-type="chart">
                <span className="dice-label">Revenue</span>
              </a>
              <a href="/tests" className="dice-tile" data-type="chart">
                <span className="dice-label">Tests</span>
              </a>
              <a href="/numbers" className="dice-tile" data-type="chart">
                <span className="dice-label">Numbers</span>
              </a>
              <a href="/tat" className="dice-tile" data-type="chart">
                <span className="dice-label">TAT</span>
              </a>
            </>
          )}

          {/* Table Tiles - For all except Viewer */}
          {showTables && (
            <>
              <a href="/reception" className="dice-tile" data-type="table">
                <span className="dice-label">Reception</span>
              </a>
              <a href="/meta" className="dice-tile" data-type="table">
                <span className="dice-label">Meta</span>
              </a>
              <a href="/progress" className="dice-tile" data-type="table">
                <span className="dice-label">Progress</span>
              </a>
              <a href="/performance" className="dice-tile" data-type="table">
                <span className="dice-label">Performance</span>
              </a>
              <a href="/tracker" className="dice-tile" data-type="table">
                <span className="dice-label">Tracker</span>
              </a>
            </>
          )}

          {/* LRIDS - For all roles */}
          <a href="/lrids" className="dice-tile" data-type="display">
            <span className="dice-label">LRIDS</span>
          </a>

          {/* Admin Panel - Only for Admin and Manager */}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <a href="/admin" className="dice-tile" data-type="table">
              <span className="dice-label">Admin Panel</span>
            </a>
          )}
        </div>
      </div>

      <footer>
        <img
          src="/images/zyntel_no_background.png"
          alt="Zyntel Icon"
          className="footer-logo"
        />
      </footer>
    </div>
  );
};

export default Dashboard;