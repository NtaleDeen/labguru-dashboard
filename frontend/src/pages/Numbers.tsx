import React, { useState, useEffect } from 'react';
import Filters from '../components/Filters';

const Numbers: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'thisMonth',
    shift: 'all',
    hospitalUnit: 'all'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      setTimeout(() => setIsLoading(false), 500);
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      period: 'thisMonth',
      shift: 'all',
      hospitalUnit: 'all'
    });
  };

  return (
    <div className="min-h-screen bg-background-color">
      <header>
        <div className="header-container">
          <div className="header-left">
            <div className="logo">
              <img src="/images/logo-nakasero.png" alt="logo" />
            </div>
            <h1>NHL Laboratory Dashboard</h1>
          </div>
          <div className="page">
            <span>Numbers</span>
            <a href="/login" className="logout-button">Logout</a>
            <a href="#" className="logout-button" onClick={resetFilters}>Reset Filters</a>
            <span className="three-dots-menu-container">
              <button className="three-dots-button">&#x22EE;</button>
              <ul className="dropdown-menu">
                <li><a href="#">Export charts as PDF</a></li>
                <li><a href="/admin">Admin Panel</a></li>
                <li><a href="/dashboard">Dashboard</a></li>
              </ul>
            </span>
          </div>
        </div>

        <Navbar type="chart" />

        <div className="main-search-container">
          <Filters filters={filters} onFilterChange={updateFilter} showLabSectionFilter={false} showShiftFilter={true} showLaboratoryFilter={true} />
        </div>
      </header>

      {isLoading && <div className="loader"><div className="one"></div><div className="two"></div><div className="three"></div><div className="four"></div></div>}

      <main className="dashboard-layout">
        <aside className="numbers-summary-card">
          <div className="kpi-card kpi-card-full-width">
            <div className="kpi-label">Total Requests</div>
            <div className="kpi-value">0</div>
          </div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Average Daily Requests</div>
              <div className="kpi-value">0</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Busiest Hour</div>
              <div className="kpi-value">N/A</div>
            </div>
            <div className="kpi-card kpi-card-full-width">
              <div className="kpi-label">Busiest Day</div>
              <div className="kpi-value">N/A</div>
            </div>
          </div>
        </aside>

        <div className="charts-area">
          <div className="dashboard-charts">
            <div className="daily-numbers-chart">
              <div className="chart-title">Daily Request Volume</div>
              <div className="chart-container">
                <canvas></canvas>
              </div>
            </div>
            <div className="hourly-numbers-chart">
              <div className="chart-title">Hourly Request Volume</div>
              <div className="chart-container">
                <canvas></canvas>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="notice">
        <p>Sorry! You need a wider screen to view the charts.</p>
      </div>

      <footer>
        <p>&copy;2025 Zyntel</p>
        <div className="zyntel">
          <img src="/images/zyntel_no_background.png" alt="logo" />
        </div>
      </footer>
    </div>
  );
};

export default Numbers;