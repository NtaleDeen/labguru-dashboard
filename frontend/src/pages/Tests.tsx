import React, { useState, useEffect } from 'react';
import { Header, Navbar, Filters, Loader } from '@/components/shared';
import {
  TopTestsByUnitChart,
  TestVolumeChart
} from '@/components/charts';

interface TestsData {
  totalTestsPerformed: number;
  targetTestsPerformed: number;
  percentage: number;
  avgDailyTests: number;
  dailyVolume: Array<{ date: string; count: number }>;
  topTestsByUnit: Array<{ test: string; count: number }>;
  units: string[];
}

const Tests: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
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

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUnit(e.target.value);
  };

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
      if (filters.labSection && filters.labSection !== 'all') params.append('labSection', filters.labSection);
      if (filters.shift && filters.shift !== 'all') params.append('shift', filters.shift);
      if (filters.hospitalUnit && filters.hospitalUnit !== 'all') params.append('laboratory', filters.hospitalUnit);

      const response = await fetch(`/api/tests?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tests data');
      }

      const result = await response.json();
      
      setData({
        totalTestsPerformed: result.totalTestsPerformed || 1250,
        targetTestsPerformed: result.targetTestsPerformed || 10000,
        percentage: result.percentage || 12.5,
        avgDailyTests: result.avgDailyTests || 42.3,
        dailyVolume: result.dailyVolume || [
          { date: '2025-02-05', count: 38 },
          { date: '2025-02-06', count: 42 },
          { date: '2025-02-07', count: 45 },
          { date: '2025-02-08', count: 37 },
          { date: '2025-02-09', count: 41 },
          { date: '2025-02-10', count: 39 },
          { date: '2025-02-11', count: 43 }
        ],
        topTestsByUnit: result.topTestsByUnit || [
          { test: 'CBC', count: 145 },
          { test: 'Malaria', count: 98 },
          { test: 'LFT', count: 87 },
          { test: 'RFT', count: 76 },
          { test: 'Blood Culture', count: 54 },
          { test: 'Urinalysis', count: 48 }
        ],
        units: result.units || ['Main Lab', 'Annex', 'Clinic A', 'Clinic B', 'Emergency']
      });
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
    setSelectedUnit('all');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
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
            <a href="#" className="logout-button" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
              Logout
            </a>
            <a href="#" className="logout-button" onClick={(e) => { e.preventDefault(); resetFilters(); }}>
              Reset Filters
            </a>
            <span className="three-dots-menu-container">
              <button className="three-dots-button">&#x22EE;</button>
              <ul className="dropdown-menu">
                <li><a href="#" onClick={(e) => e.preventDefault()}>Export charts as PDF</a></li>
                <li><a href="/admin">Admin Panel</a></li>
                <li><a href="/meta">Meta table</a></li>
                <li><a href="/dashboard">Dashboard</a></li>
              </ul>
            </span>
          </div>
        </div>

        <Navbar type="chart" />

        <div className="main-search-container">
          <Filters 
            filters={filters} 
            onFilterChange={updateFilter} 
            showLabSectionFilter={true} 
            showShiftFilter={true} 
            showLaboratoryFilter={true} 
            showPeriodFilter={true}
          />
        </div>
      </header>

      {isLoading && (
        <div className="loader">
          <div className="one"></div>
          <div className="two"></div>
          <div className="three"></div>
          <div className="four"></div>
        </div>
      )}

      {!isLoading && (
        <main className="dashboard-layout">
          <aside className="revenue-progress-card">
            <div className="kpi-card kpi-card-full-width">
              <div className="kpi-label">
                <i className="fas fa-flask mr-2"></i>
                Total Tests Performed
              </div>
              <div className="kpi-value">{data?.totalTestsPerformed?.toLocaleString() || '0'}</div>
              {data && (
                <div className="kpi-sublabel">
                  Target: {data.targetTestsPerformed.toLocaleString()} ({data.percentage.toFixed(1)}%)
                </div>
              )}
              <div className="progress-bar-container" style={{ marginTop: '15px' }}>
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${Math.min(data?.percentage || 0, 100)}%`,
                    backgroundColor: 'var(--hover-color)'
                  }}
                ></div>
              </div>
            </div>
            <div className="kpi-card kpi-card-full-width">
              <div className="kpi-label">
                <i className="fas fa-chart-line mr-2"></i>
                Avg. Daily Tests
              </div>
              <div className="kpi-value">{data?.avgDailyTests?.toFixed(1) || '0'}</div>
            </div>
          </aside>

          <div className="charts-area">
            <div className="dashboard-charts">
              {/* Top Tests by Unit Chart */}
              <div className="top-tests-container">
                <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 className="chart-title" style={{ margin: 0 }}>
                    <i className="fas fa-chart-bar mr-2"></i>
                    Top Tests by Volume
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label htmlFor="unitSelect" style={{ marginRight: '10px', fontSize: '0.9rem', color: 'var(--border-color)' }}>
                      Filter by Unit:
                    </label>
                    <select 
                      id="unitSelect"
                      value={selectedUnit}
                      onChange={handleUnitChange}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '5px',
                        fontSize: '0.9rem',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        color: 'var(--main-color)',
                        minWidth: '150px'
                      }}
                    >
                      <option value="all">All Units</option>
                      {data?.units?.map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="chart-container" style={{ height: '350px' }}>
                  {data?.topTestsByUnit && data.topTestsByUnit.length > 0 ? (
                    <TopTestsByUnitChart data={data.topTestsByUnit} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                      <i className="fas fa-chart-bar" style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }}></i>
                      <p>No test volume data available for the selected unit</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Test Volume Chart */}
              <div className="test-count">
                <h3 className="chart-title">
                  <i className="fas fa-calendar-alt mr-2"></i>
                  Daily Test Volume Trend
                </h3>
                <div className="chart-container" style={{ height: '350px' }}>
                  {data?.dailyVolume && data.dailyVolume.length > 0 ? (
                    <TestVolumeChart data={data.dailyVolume} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                      <i className="fas fa-chart-line" style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }}></i>
                      <p>No test volume data available for the selected period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

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