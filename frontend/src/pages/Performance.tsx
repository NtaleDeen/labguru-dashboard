import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface PerformanceRecord {
  id: number;
  date: string;
  shift: string;
  lab_no: string;
  unit: string;
  time_in: string;
  daily_tat: number;
  time_expected: string;
  time_out: string;
  delay_status: 'on-time' | 'delayed-less-15' | 'over-delayed';
  time_range: string;
}

const Performance: React.FC = () => {
  const [data, setData] = useState<PerformanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'custom',
    shift: 'all',
    laboratory: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchData();
  }, [filters, currentPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/performance', { 
        params: { 
          ...filters,
          page: currentPage,
          limit: itemsPerPage
        } 
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      period: 'custom',
      shift: 'all',
      laboratory: 'all',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter('search', e.target.value);
  };

  const handleExportCSV = () => {
    // CSV export logic here
    alert('Export CSV functionality to be implemented');
  };

  const handleLogout = () => {
    // Logout logic here
    alert('Logout functionality to be implemented');
  };

  const getDelayStatusClass = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'status-on-time';
      case 'delayed-less-15':
        return 'status-delayed-less-15';
      case 'over-delayed':
        return 'status-over-delayed';
      default:
        return '';
    }
  };

  const getDelayStatusText = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'On Time';
      case 'delayed-less-15':
        return '<15 min Delayed';
      case 'over-delayed':
        return 'Over Delayed';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background-color">
      {/* Header - EXACT VANILLA DESIGN */}
      <header>
        <div className="header-container">
          <div className="header-left">
            <div className="logo">
              <img src="/images/logo-nakasero.png" alt="logo" />
            </div>
            <h1>Nakasero Hospital Laboratory</h1>
          </div>
          <div className="page page-table">
            <span>Performance Table</span>
            <a href="#" className="logout-button" onClick={handleLogout}>
              Logout
            </a>
            <a href="#" className="logout-button" onClick={resetFilters}>
              Reset Filters
            </a>
            <span className="three-dots-menu-container">
              <button className="three-dots-button">&#x22EE;</button>
              <ul className="dropdown-menu">
                <li><a href="#" onClick={handleExportCSV}>Export table as CSV</a></li>
                <li><a href="/progress">Progress table</a></li>
                <li><a href="/reception">Reception table</a></li>
                <li><a href="/tracker">Tracker table</a></li>
                <li><a href="/meta">Meta table</a></li>
                <li><a href="/dashboard">Dashboard</a></li>
              </ul>
            </span>
          </div>
        </div>

        {/* Search and Filters - EXACT VANILLA DESIGN */}
        <div className="main-search-container">
          <div className="search-actions-row">
            <div className="search-container">
              <input
                type="text"
                id="searchInput"
                className="search-input"
                placeholder="Search test / lab Number..."
                value={filters.search}
                onChange={handleSearch}
              />
              <i className="fas fa-search search-icon"></i>
            </div>
          </div>
        </div>

        {/* Filters - EXACT VANILLA DESIGN */}
        <div className="dashboard-filters" id="filters">
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
              <option value="custom">Custom</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisQuarter">This Quarter</option>
              <option value="lastQuarter">Last Quarter</option>
              {/* Add months as per your request */}
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
              value={filters.laboratory}
              onChange={(e) => updateFilter('laboratory', e.target.value)}
            >
              <option value="all">All</option>
              <option value="mainLab">Main Laboratory</option>
              <option value="annex">Annex</option>
            </select>
          </div>
        </div>
      </header>

      <main>
        {/* Loader - EXACT VANILLA DESIGN */}
        {isLoading && (
          <div className="loader" id="loadingOverlay">
            <div className="loading one"></div>
            <div className="loading two"></div>
            <div className="loading three"></div>
            <div className="loading four"></div>
          </div>
        )}

        <section className="card">
          <div className="table-container">
            {/* Performance Table - EXACT VANILLA COLUMNS */}
            <table id="performance" className="neon-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Shift</th>
                  <th className="lab-number-cell">Lab Number</th>
                  <th>Unit</th>
                  <th>Time In</th>
                  <th>
                    Daily TAT <span className="subtext">(minutes)</span>
                  </th>
                  <th>Time Expected</th>
                  <th>Time Out</th>
                  <th>Delay Status</th>
                  <th>Time Range</th>
                </tr>
              </thead>
              <tbody id="performanceBody">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-gray-500">
                      Loading data...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-4 text-gray-500">
                      No performance data found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  data.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>{record.date}</td>
                      <td>{record.shift}</td>
                      <td className="lab-number-cell">{record.lab_no}</td>
                      <td>{record.unit}</td>
                      <td>{record.time_in}</td>
                      <td>{record.daily_tat}</td>
                      <td>{record.time_expected}</td>
                      <td>{record.time_out || '-'}</td>
                      <td className={getDelayStatusClass(record.delay_status)}>
                        {getDelayStatusText(record.delay_status)}
                      </td>
                      <td>{record.time_range}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div id="pagination-container" className="pagination-container">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {currentPage}
              </span>
              
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={data.length < itemsPerPage}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          {/* Message Box */}
          <div id="performanceMessage" className="message-box hidden"></div>
        </section>
      </main>

      {/* Mobile Notice */}
      <div className="notice">
        <p>Sorry!</p>
        You need a wider screen to view the table.
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

export default Performance;