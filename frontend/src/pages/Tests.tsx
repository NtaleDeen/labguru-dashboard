import React, { useState, useEffect } from 'react';
import { Header, Navbar, Filters, Loader, KPICard } from '@/components/shared';
import {
  TestVolumeChart,
  TopTestsChart
} from '@/components/charts';

interface TestsData {
  totalTestsPerformed: number;
  targetTestsPerformed: number;
  percentage: number;
  avgDailyTests: number;
  testVolumeTrend: Array<{ date: string; count: number }>;
  topTestsByUnit: { [key: string]: Array<{ test_name: string; count: number }> };
}

const Tests: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'thisMonth',
    labSection: 'all',
    shift: 'all',
    hospitalUnit: 'all'
  });
  const [data, setData] = useState<TestsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append('period', filters.period);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.labSection) params.append('labSection', filters.labSection);
      if (filters.shift) params.append('shift', filters.shift);
      if (filters.hospitalUnit) params.append('laboratory', filters.hospitalUnit);

      const response = await fetch(`/api/tests?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tests data');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error:', error);
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
      <header>
        <div className="header-container">
          <div className="header-left">
            <div className="logo">
              <img src="/images/logo-nakasero.png" alt="logo" />
            </div>
            <h1>NHL Laboratory Dashboard</h1>
          </div>
          <div className="page">
            <span>Tests</span>
            <a href="/login" className="logout-button">Logout</a>
            <a href="#" className="logout-button" onClick={resetFilters}>Reset Filters</a>
            <span className="three-dots-menu-container">
              <button className="three-dots-button">&#x22EE;</button>
              <ul className="dropdown-menu">
                <li><a href="#">Export charts as PDF</a></li>
                <li><a href="/admin">Admin Panel</a></li>
                <li><a href="/meta">Meta table</a></li>
                <li><a href="/dashboard">Dashboard</a></li>
              </ul>
            </span>
          </div>
        </div>

        <Navbar type="chart" />

        <div className="main-search-container">
          <Filters filters={filters} onFilterChange={updateFilter} showLabSectionFilter={true} showShiftFilter={true} showLaboratoryFilter={true} />
        </div>
      </header>

      {isLoading && <div className="loader"><div className="one"></div><div className="two"></div><div className="three"></div><div className="four"></div></div>}

      <main className="dashboard-layout">
        <aside className="revenue-progress-card">
          <div className="kpi-card kpi-card-full-width">
            <div className="kpi-label">Total Tests Performed</div>
            <div className="kpi-value">{data?.totalTestsPerformed?.toLocaleString() || '0'}</div>
            {data && (
              <div className="kpi-sublabel">
                Target: {data.targetTestsPerformed.toLocaleString()} ({data.percentage.toFixed(1)}%)
              </div>
            )}
          </div>
          <div className="kpi-card kpi-card-full-width">
            <div className="kpi-label">Avg. Daily Tests</div>
            <div className="kpi-value">{data?.avgDailyTests?.toFixed(1) || '0'}</div>
          </div>
        </aside>

        <div className="charts-area">
          <div className="dashboard-charts">
            <div className="top-tests-container">
              <div className="chart-title">
                <label htmlFor="unitSelect" className="unitSelect-label">Select Hospital Unit:</label>
                <select id="unitSelect"></select>
              </div>
              <div className="chart-container">
                <canvas></canvas>
              </div>
            </div>
            <div className="test-count">
              <div className="chart-title">Test Volume</div>
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

export default Tests;