// Reception.tsx - UPDATED WITH EXACT OLD DESIGN
import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import ReceptionTable from '../components/tables/ReceptionTable';
import Loader from '../components/shared/Loader';
import { TestRecord } from '../types';
import api from '../services/api';

const Reception: React.FC = () => {
  const [data, setData] = useState<TestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'custom',
    labSection: 'all',
    shift: 'all',
    hospitalUnit: 'all',
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/reception', { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching reception data:', error);
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
      search: ''
    });
  };

  const handleUpdateStatus = async (id: number, updates: any) => {
    try {
      const response = await api.put(`/reception/${id}/status`, updates);
      setData(prev => prev.map(test => test.id === id ? response.data : test));
    } catch (error) {
      console.error('Error updating test status:', error);
    }
  };

  const handleCancelTest = async (id: number, reason: string) => {
    try {
      const response = await api.post(`/reception/${id}/cancel`, { reason });
      setData(prev => prev.map(test => test.id === id ? response.data : test));
    } catch (error) {
      console.error('Error cancelling test:', error);
    }
  };

  const handleBulkUpdate = async (testIds: number[], action: string) => {
    try {
      await api.post('/reception/bulk-update', { testIds, action });
      fetchData();
    } catch (error) {
      console.error('Error bulk updating tests:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background-color">
      <Header title="Reception Table" />

      {/* Tab Navigation - EXACT OLD DESIGN */}
      <nav className="navbar">
        <a href="/dashboard">Home</a>
        <a href="/reception" className="active">Reception</a>
        <a href="/meta">Meta</a>
        <a href="/progress">Progress</a>
        <a href="/tracker">Tracker</a>
      </nav>

      {/* Search and Filters - EXACT OLD DESIGN */}
      <div className="main-search-container">
        <div className="search-actions-row">
          {/* Multi-select action buttons container */}
          <div id="multi-select-actions" className="multi-select-container hidden">
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

      <main>
        {isLoading ? (
          <Loader />
        ) : (
          <section className="card">
            <div className="table-container">
              <ReceptionTable
                data={data}
                onUpdateStatus={handleUpdateStatus}
                onCancelTest={handleCancelTest}
                onBulkUpdate={handleBulkUpdate}
              />
            </div>
          </section>
        )}
      </main>

      <div className="notice">
        <p>Sorry!</p>
        You need a wider screen to view the table.
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

export default Reception;