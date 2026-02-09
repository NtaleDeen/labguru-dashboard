// Reception.tsx - EXACT VANILLA DESIGN WITH NAVBAR
import React, { useState, useEffect } from 'react';

const Reception: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'custom',
    labSection: 'all',
    shift: 'all',
    hospitalUnit: 'all',
    search: ''
  });
  const [selectedTests, setSelectedTests] = useState<number[]>([]);

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
      search: ''
    });
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
            <span>Reception Table</span>
            <a href="#" className="logout-button" id="logout-button">Logout</a>
            <a href="#" className="logout-button" id="reset-filters-button" onClick={resetFilters}>
              Reset Filters
            </a>
            <span className="three-dots-menu-container">
              <button className="three-dots-button">&#x22EE;</button>
              <ul className="dropdown-menu">
                <li><a href="/progress">Progress table</a></li>
                <li><a href="/performance">Performance table</a></li>
                <li><a href="/tracker">Tracker table</a></li>
                <li><a href="/meta">Meta table</a></li>
                <li><a href="/dashboard">Dashboard</a></li>
              </ul>
            </span>
          </div>
        </div>

        {/* Table Pages Navbar - EXACT VANILLA WITH BLUE BACKGROUND */}
        <nav className="navbar">
          <a href="/dashboard">Home</a>
          <a href="/reception" className="active">Reception</a>
          <a href="/meta">Meta</a>
          <a href="/progress">Progress</a>
          <a href="/performance">Performance</a>
          <a href="/tracker">Tracker</a>
          <a href="/lrids">LRIDS</a>
        </nav>

        {/* Search and Filters - EXACT VANILLA DESIGN */}
        <div className="main-search-container">
          <div className="search-actions-row">
            {/* Multi-select action buttons container - EXACT VANILLA */}
            <div id="multi-select-actions" className={`multi-select-container ${selectedTests.length > 0 ? '' : 'hidden'}`}>
              <button
                id="multi-urgent-btn"
                className="urgent-btn"
              >
                Mark as Urgent
              </button>
              <button
                id="multi-receive-btn"
                className="receive-btn"
              >
                Receive Selected
              </button>
              <button
                id="multi-result-btn"
                className="result-btn"
              >
                Result Selected
              </button>
            </div>
            <div className="search-container">
              <input
                type="text"
                id="searchInput"
                className="search-input"
                placeholder="Search test / lab Number..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
              <i className="fas fa-search search-icon"></i>
            </div>
          </div>
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
          </div>
        </div>
      </header>

      <main style={{ paddingTop: '300px' }}>
        {/* Reception table would go here - using exact vanilla design */}
        <div className="card">
          <div className="table-container">
            <table className="neon-table">
              <thead>
                <tr>
                  <th className="py-2 px-4">
                    <input
                      type="checkbox"
                      id="selectAll"
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                  </th>
                  <th>Date</th>
                  <th className="lab-number-cell">Lab Number</th>
                  <th>Shift</th>
                  <th>Unit</th>
                  <th>Lab Section</th>
                  <th>Test Name</th>
                  <th className="text-center">Urgency</th>
                  <th className="text-center">Receive</th>
                  <th className="text-center">Result</th>
                </tr>
              </thead>
              <tbody>
                {/* Table data would go here */}
              </tbody>
            </table>
          </div>
        </div>
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

export default Reception;