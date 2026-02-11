import React, { useState, useEffect } from 'react';
import { Header, Navbar, Filters, Loader, KPICard } from '@/components/shared';
import {
  DailyRevenueChart,
  SectionRevenueChart,
  TestRevenueChart,
  HospitalUnitRevenueChart
} from '@/components/charts';

interface RevenueData {
  totalRevenue: number;
  targetRevenue: number;
  percentage: number;
  avgDailyRevenue: number;
  revenueGrowthRate: number;
  dailyRevenue: Array<{ date: string; revenue: number }>;
  sectionRevenue: Array<{ section: string; revenue: number }>;
  testRevenue: Array<{ test_name: string; revenue: number }>;
  hospitalUnitRevenue: Array<{ unit: string; revenue: number }>;
}

const Revenue: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'thisMonth',
    labSection: 'all',
    shift: 'all',
    hospitalUnit: 'all'
  });
  const [data, setData] = useState<RevenueData | null>(null);
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

      const response = await fetch(`/api/revenue?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
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
            <span>Revenue</span>
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
          <div className="label">Total Revenue</div>
          <div className="percentage">{data?.percentage?.toFixed(1) || '0'}%</div>
          <div className="amounts">
            <span>UGX {data?.totalRevenue?.toLocaleString() || '0'}</span>
            <span className="target">of UGX {data?.targetRevenue?.toLocaleString() || '1.5B'}</span>
          </div>
          <canvas className="chart-bar"></canvas>

          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Avg. Daily Revenue</div>
              <div className="kpi-value">UGX {data?.avgDailyRevenue?.toLocaleString() || '0'}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Revenue Growth Rate</div>
              <div className="kpi-value">{data?.revenueGrowthRate?.toFixed(1) || '0'}%</div>
            </div>
          </div>
        </aside>

        <div className="charts-area">
          <div className="dashboard-charts">
            {/* Daily Revenue Chart */}
            <div className="revenue">
              <div className="chart-title">Daily Revenue</div>
              <div className="chart-container">
                {data?.dailyRevenue ? (
                  <DailyRevenueChart data={data.dailyRevenue} />
                ) : (
                  <p style={{ textAlign: 'center', color: '#999' }}>No data available</p>
                )}
              </div>
            </div>

            {/* Section Revenue Chart */}
            <div className="section-revenue">
              <div className="chart-title">Revenue by Laboratory Section</div>
              <div className="chart-container">
                {data?.sectionRevenue ? (
                  <SectionRevenueChart data={data.sectionRevenue} />
                ) : (
                  <p style={{ textAlign: 'center', color: '#999' }}>No data available</p>
                )}
              </div>
            </div>

            {/* Hospital Unit Revenue Chart */}
            <div className="hospital-unit">
              <div className="chart-title">Revenue by Hospital Unit</div>
              <div className="chart-container">
                {data?.hospitalUnitRevenue ? (
                  <HospitalUnitRevenueChart data={data.hospitalUnitRevenue} />
                ) : (
                  <p style={{ textAlign: 'center', color: '#999' }}>No data available</p>
                )}
              </div>
            </div>

            {/* Test Revenue Chart */}
            <div className="test-revenue">
              <div className="chart-title">Revenue by Test (Top 50)</div>
              <div className="chart-container">
                {data?.testRevenue ? (
                  <TestRevenueChart data={data.testRevenue} />
                ) : (
                  <p style={{ textAlign: 'center', color: '#999' }}>No data available</p>
                )}
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

export default Revenue;