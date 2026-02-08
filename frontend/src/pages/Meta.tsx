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
              <h2 className="text-xl font-bold text-main-color">Meta Data Table</h2>
              <button className="bg-main-color text-white px-4 py-2 rounded-lg hover:bg-hover-color transition-colors">
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
                        <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors">
                          <i className="fas fa-edit mr-1"></i> Edit
                        </button>
                        <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors">
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

export default Meta;