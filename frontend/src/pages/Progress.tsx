import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Progress: React.FC = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'custom',
    labSection: 'all',
    shift: 'all',
    hospitalUnit: 'all',
    status: 'all'
  });

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/progress', { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching progress data:', error);
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
      period: 'custom',
      labSection: 'all',
      shift: 'all',
      hospitalUnit: 'all',
      status: 'all'
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
                <li><a href="/reception">Reception</a></li>
                <li><a href="/meta">Meta</a></li>
                <li><a href="/progress">Progress</a></li>
                <li><a href="/tracker">Tracker</a></li>
              </ul>
            </span>
          </div>
        </div>
      </header>

      {/* Table Pages Navbar */}
      <nav className="navbar-tables">
        <a href="/dashboard">Home</a>
        <a href="/reception">Reception</a>
        <a href="/meta" className={window.location.pathname === '/meta' ? 'active' : ''}>Meta</a>
        <a href="/progress" className={window.location.pathname === '/progress' ? 'active' : ''}>Progress</a>
        <a href="/performance" className={window.location.pathname === '/performance' ? 'active' : ''}>Performance</a>
        <a href="/tracker" className={window.location.pathname === '/tracker' ? 'active' : ''}>Tracker</a>
      </nav>

      {/* Search and Filters */}
      <div className="main-search-container">
        <div className="search-actions-row">
          <div className="search-container">
            <input
              type="text"
              id="searchInput"
              className="search-input"
              placeholder="Search test or lab number..."
              onChange={(e) => updateFilter('search', e.target.value)}
            />
            <i className="fas fa-search search-icon"></i>
          </div>
        </div>
      </div>

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
            <option value="custom">Custom</option>
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
          <label htmlFor="statusFilter">Status:</label>
          <select
            id="statusFilter"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
          </select>
        </div>
        <div className="filter-group">
          <button onClick={resetFilters} className="logout-button">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main>
        {isLoading ? (
          <div className="loader">
            <div className="one"></div>
            <div className="two"></div>
            <div className="three"></div>
            <div className="four"></div>
          </div>
        ) : (
          <section className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-main-color">Test Progress Overview</h2>
              <span className="text-sm text-gray-500">
                <i className="fas fa-sync-alt mr-1"></i> Auto-refreshes every 30 seconds
              </span>
            </div>
            
            <div className="table-container">
              <table className="neon-table">
                <thead>
                  <tr>
                    <th>Lab Number</th>
                    <th>Test Name</th>
                    <th>Section</th>
                    <th>Time Received</th>
                    <th>Current Status</th>
                    <th>Time Status Updated</th>
                    <th>Time Elapsed</th>
                    <th>Expected Completion</th>
                    <th>Progress</th>
                    <th>Technician</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any) => (
                    <tr key={item.id}>
                      <td className="lab-number-cell">{item.lab_no}</td>
                      <td>{item.test_name}</td>
                      <td>{item.section}</td>
                      <td>{item.time_received}</td>
                      <td className={
                        item.status === 'completed' ? 'progress-complete' :
                        item.status === 'delayed' ? 'progress-overdue' :
                        item.status === 'urgent' ? 'progress-urgent' :
                        'progress-pending'
                      }>
                        {item.status}
                      </td>
                      <td>{item.time_status_updated}</td>
                      <td>{item.time_elapsed}</td>
                      <td>{item.expected_completion}</td>
                      <td>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-main-color h-2 rounded-full" 
                            style={{ width: `${item.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{item.progress || 0}%</span>
                      </td>
                      <td>{item.technician || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
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

export default Progress;