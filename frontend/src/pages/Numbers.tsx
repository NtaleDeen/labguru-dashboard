import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface NumbersData {
  totalRequests: number;
  avgDailyRequests: number;
  busiestHour: string;
  busiestDay: string;
  dailyVolume: { date: string; count: number }[];
  hourlyVolume: { hour: number; count: number }[];
}

const Numbers: React.FC = () => {
  const [data, setData] = useState<NumbersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'thisMonth',
    labSection: 'all',
    shift: 'all',
    hospitalUnit: 'all'
  });

  useEffect(() => {
    fetchNumbersData();
  }, [filters]);

  const fetchNumbersData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/numbers', { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching numbers data:', error);
    } finally {
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
      labSection: 'all',
      shift: 'all',
      hospitalUnit: 'all'
    });
  };

  return (
    <div className="min-h-screen bg-background-color">
      {/* Header */}
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
                <li><a href="/tests">Tests</a></li>
                <li><a href="/numbers">Numbers</a></li>
                <li><a href="/tat">TAT</a></li>
              </ul>
            </span>
          </div>
        </div>
      </header>

      {/* Charts Pages Navbar */}
      <nav className="navbar">
        <a href="/dashboard">Home</a>
        <a href="/revenue">Revenue</a>
        <a href="/tests">Tests</a>
        <a href="/numbers" className="active">Numbers</a>
        <a href="/tat">TAT</a>
      </nav>

      {/* Filters */}
      <div className="dashboard-filters">
        <div className="filter-group">
          <label htmlFor="startDateFilter">Start Date:</label>
          <input
            type="date"
            id="startDateFilter"
            value={filters.startDate}
            onChange={(e) => updateFilter('startDate', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="endDateFilter">End Date:</label>
          <input
            type="date"
            id="endDateFilter"
            value={filters.endDate}
            onChange={(e) => updateFilter('endDate', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="periodSelect">Period:</label>
          <select
            id="periodSelect"
            value={filters.period}
            onChange={(e) => updateFilter('period', e.target.value)}
          >
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisQuarter">This Quarter</option>
            <option value="lastQuarter">Last Quarter</option>
            <option value="january">January</option>
            <option value="february">February</option>
            <option value="march">March</option>
            <option value="april">April</option>
            <option value="may">May</option>
            <option value="june">June</option>
            <option value="july">July</option>
            <option value="august">August</option>
            <option value="september">September</option>
            <option value="october">October</option>
            <option value="november">November</option>
            <option value="december">December</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="labSectionFilter">Lab Section:</label>
          <select
            id="labSectionFilter"
            value={filters.labSection}
            onChange={(e) => updateFilter('labSection', e.target.value)}
          >
            <option value="all">All</option>
            <option value="chemistry">Chemistry</option>
            <option value="heamatology">Heamatology</option>
            <option value="microbiology">Microbiology</option>
            <option value="serology">Serology</option>
            <option value="referral">Referral</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="shiftFilter">Shift:</label>
          <select
            id="shiftFilter"
            value={filters.shift}
            onChange={(e) => updateFilter('shift', e.target.value)}
          >
            <option value="all">All</option>
            <option value="day shift">Day Shift</option>
            <option value="night shift">Night Shift</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="hospitalUnitFilter">Laboratory:</label>
          <select
            id="hospitalUnitFilter"
            value={filters.hospitalUnit}
            onChange={(e) => updateFilter('hospitalUnit', e.target.value)}
          >
            <option value="all">All</option>
            <option value="mainLab">Main Laboratory</option>
            <option value="annex">Annex</option>
          </select>
        </div>
        <div className="filter-group">
          <button onClick={resetFilters} className="logout-button">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Loader */}
      {isLoading && (
        <div className="loader">
          <div className="one"></div>
          <div className="two"></div>
          <div className="three"></div>
          <div className="four"></div>
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-layout">
        {/* Left Sidebar - Numbers Summary Card */}
        <aside className="numbers-summary-card">
          <div className="label">Total Test Requests</div>
          <div className="percentage" id="totalRequests">
            {data ? data.totalRequests.toLocaleString() : '0'}
          </div>
          <div className="amounts">
            <span id="avgDailyRequests">
              {data ? Math.round(data.avgDailyRequests).toLocaleString() : '0'}
            </span>
            <span className="target">Average Daily</span>
          </div>
          
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Busiest Hour</div>
              <div className="kpi-value" id="busiestHour">
                {data?.busiestHour || 'N/A'}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-label">Busiest Day</div>
              <div className="kpi-value" id="busiestDay">
                {data?.busiestDay || 'N/A'}
              </div>
            </div>
          </div>
        </aside>

        {/* Charts Area */}
        <div className="charts-area">
          <div className="dashboard-charts">
            {/* Daily Request Volume Chart */}
            <div className="chart-container">
              <h2 className="chart-title">Daily Request Volume</h2>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <i className="fas fa-chart-bar text-4xl mb-4"></i>
                <p>Chart will be rendered here</p>
              </div>
            </div>

            {/* Hourly Request Volume Chart */}
            <div className="chart-container">
              <h2 className="chart-title">Hourly Request Volume</h2>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <i className="fas fa-chart-line text-4xl mb-4"></i>
                <p>Chart will be rendered here</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Notice */}
      <div className="notice">
        <p>Sorry!</p>
        You need a wider screen to view the charts.
      </div>

      {/* Footer */}
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