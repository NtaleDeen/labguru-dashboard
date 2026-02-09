import React, { useState, useEffect } from 'react';
import { TestMetadata } from '../types';
import api from '../services/api';

const Meta: React.FC = () => {
  const [data, setData] = useState<TestMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/metadata');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching metadata:', error);
    } finally {
      setIsLoading(false);
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
          <span>Meta Table</span>
          <a href="#" className="logout-button" id="logout-button">Logout</a>
          <span className="three-dots-menu-container">
            <button className="three-dots-button">&#x22EE;</button>
            <ul className="dropdown-menu">
              <li><a href="#" id="export-csv-link">Export table as CSV</a></li>
              <li><a href="/progress">Progress table</a></li>
              <li><a href="/reception">Reception table</a></li>
              <li><a href="/performance">Performance table</a></li>
              <li><a href="/tracker">Tracker table</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
            </ul>
          </span>
        </div>
      </div>

      {/* Table Pages Navbar - EXACT VANILLA WITH BLUE BACKGROUND */}
      <nav className="navbar">
        <a href="/dashboard">Home</a>
        <a href="/reception">Reception</a>
        <a href="/meta" className="active">Meta</a>
        <a href="/progress">Progress</a>
        <a href="/performance">Performance</a>
        <a href="/tracker">Tracker</a>
        <a href="/lrids">LRIDS</a>
      </nav>

      {/* Search and Filters */}
      <div className="main-search-container">
        <div className="search-actions-row">
          <div className="search-container">
            <input
              type="text"
              id="searchInput"
              className="search-input"
              placeholder="Search test / lab Number..."
            />
            <i className="fas fa-search search-icon"></i>
          </div>
        </div>
        <div className="dashboard-filters">
          <div className="filter-group">
            <label htmlFor="labSectionFilter">Lab Section:</label>
            <select id="labSectionFilter">
              <option value="all">All</option>
              <option value="chemistry">Chemistry</option>
              <option value="heamatology">Heamatology</option>
              <option value="microbiology">Microbiology</option>
              <option value="serology">Serology</option>
              <option value="referral">Referral</option>
            </select>
          </div>
        </div>
      </div>
    </header>

    <main style={{ paddingTop: '250px' }}>
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
            <h2 className="text-xl font-bold text-main-color">Meta Data Table</h2>
            <button className="meta-actions-button">
              <i className="fas fa-plus mr-2"></i> Add New Test
            </button>
          </div>
          
          <div className="table-container">
            <table className="neon-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Category</th>
                  <th>Section</th>
                  <th>Price (UGX)</th>
                  <th>Expected TAT</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.test_name}</td>
                    <td>{item.category}</td>
                    <td>{item.section}</td>
                    <td>{item.price?.toLocaleString() || '-'}</td>
                    <td>{item.expected_tat || '-'}</td>
                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-center space-x-2">
                      <button className="meta-actions-button" style={{ backgroundColor: '#3b82f6' }}>
                        <i className="fas fa-edit mr-1"></i> Edit
                      </button>
                      <button className="meta-actions-button" style={{ backgroundColor: '#ef4444' }}>
                        <i className="fas fa-trash mr-1"></i> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  </div>
  );
};

export default Meta;