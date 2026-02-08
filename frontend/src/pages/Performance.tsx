import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import Filters from '../components/shared/Filters';
import Loader from '../components/shared/Loader';
import { useFilters } from '../hooks/useFilters';
import api from '../services/api';
import { formatDateTime } from '../utils/dateUtils';

interface PerformanceRecord {
  id: number;
  encounter_date: string;
  lab_no: string;
  shift: string;
  laboratory: string;
  lab_section_at_test: string;
  test_name: string;
  time_in: string;
  time_out?: string;
  actual_tat?: number;
  tat_at_test: number;
  delay_status: 'on-time' | 'delayed-less-15' | 'over-delayed';
  time_range: string;
}

const Performance: React.FC = () => {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [data, setData] = useState<PerformanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/performance', { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
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

  return (
    <div className="min-h-screen bg-background-color">
      <Header title="Performance Table" />

      {/* Tab Navigation */}
      <nav className="navbar">
        <a href="/dashboard">Home</a>
        <a href="/reception">Reception</a>
        <a href="/meta">Meta</a>
        <a href="/progress">Progress</a>
        <a href="/performance" className="active">Performance</a>
        <a href="/tracker">Tracker</a>
      </nav>

      <main>
        <div className="main-search-container">
          <div className="dashboard-filters">
            <div className="filter-group">
              <label htmlFor="startDateFilter">Start Date:</label>
              <input
                type="date"
                id="startDateFilter"
                value={filters.startDate || ''}
                onChange={(e) => updateFilter('startDate', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="endDateFilter">End Date:</label>
              <input
                type="date"
                id="endDateFilter"
                value={filters.endDate || ''}
                onChange={(e) => updateFilter('endDate', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label htmlFor="periodSelect">Period:</label>
              <select
                id="periodSelect"
                value={filters.period || 'custom'}
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
              <label htmlFor="shiftFilter">Shift:</label>
              <select
                id="shiftFilter"
                value={filters.shift || 'all'}
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
                value={filters.laboratory || 'all'}
                onChange={(e) => updateFilter('laboratory', e.target.value)}
              >
                <option value="all">All</option>
                <option value="mainLab">Main Laboratory</option>
                <option value="annex">Annex</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <Loader />
        ) : (
          <section className="card">
            <div className="table-container">
              <table className="neon-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Shift</th>
                    <th>Lab Number</th>
                    <th>Unit</th>
                    <th>Lab Section</th>
                    <th>Test Name</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>TAT <span className="subtext">(minutes)</span></th>
                    <th>Delay Status</th>
                    <th>Time Range</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-8 text-gray-400">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    data.map((record) => (
                      <tr key={record.id}>
                        <td>
                          {new Date(record.encounter_date).toLocaleDateString()}
                        </td>
                        <td>{record.shift}</td>
                        <td className="font-mono text-main-color font-semibold">
                          {record.lab_no}
                        </td>
                        <td>{record.laboratory}</td>
                        <td>{record.lab_section_at_test}</td>
                        <td>{record.test_name}</td>
                        <td>{formatDateTime(record.time_in)}</td>
                        <td>
                          {record.time_out
                            ? formatDateTime(record.time_out)
                            : 'N/A'}
                        </td>
                        <td>{record.actual_tat || 'N/A'}</td>
                        <td className={getStatusClass(record.delay_status)}>
                          {record.delay_status === 'on-time'
                            ? 'On Time'
                            : record.delay_status === 'delayed-less-15'
                            ? '<15 min delayed'
                            : 'Over Delayed'}
                        </td>
                        <td className={getStatusClass(record.delay_status)}>
                          {record.time_range}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

export default Performance;