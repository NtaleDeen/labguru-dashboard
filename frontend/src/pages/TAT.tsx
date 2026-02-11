// frontend/src/pages/TAT.tsx
import React, { useState, useEffect } from 'react';
import { Header, Navbar, Filters, Loader, KPICard } from '@/components/shared';
import { 
  TATPieChart, 
  TATLineChart, 
  TATHourlyChart,
  TATProgressChart 
} from '@/components/charts';

interface TATData {
  pieData: {
    delayed: number;
    onTime: number;
    notUploaded: number;
  };
  dailyTrend: Array<{
    date: string;
    delayed: number;
    onTime: number;
    notUploaded: number;
  }>;
  hourlyTrend: Array<{
    hour: number;
    delayed: number;
    onTime: number;
    notUploaded: number;
  }>;
  kpis: {
    totalRequests: number;
    delayedRequests: number;
    onTimeRequests: number;
    avgDailyDelayed: number;
    avgDailyOnTime: number;
    avgDailyNotUploaded: number;
    mostDelayedHour: string;
    mostDelayedDay: string;
  };
}

const TAT: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'thisMonth',
    shift: 'all',
    hospitalUnit: 'all'
  });
  
  const [data, setData] = useState<TATData | null>(null);
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
      if (filters.shift) params.append('shift', filters.shift);
      if (filters.hospitalUnit) params.append('laboratory', filters.hospitalUnit);

      const response = await fetch(`/api/tat?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch TAT data');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching TAT data:', error);
      // Mock data for development
      setData({
        pieData: {
          delayed: 45,
          onTime: 230,
          notUploaded: 12
        },
        dailyTrend: [
          { date: '2025-02-05', delayed: 8, onTime: 32, notUploaded: 2 },
          { date: '2025-02-06', delayed: 7, onTime: 35, notUploaded: 1 },
          { date: '2025-02-07', delayed: 10, onTime: 30, notUploaded: 3 },
          { date: '2025-02-08', delayed: 5, onTime: 38, notUploaded: 2 },
          { date: '2025-02-09', delayed: 6, onTime: 36, notUploaded: 2 },
          { date: '2025-02-10', delayed: 9, onTime: 33, notUploaded: 1 },
          { date: '2025-02-11', delayed: 4, onTime: 40, notUploaded: 1 }
        ],
        hourlyTrend: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          delayed: Math.floor(Math.random() * 5),
          onTime: Math.floor(Math.random() * 15) + 5,
          notUploaded: Math.floor(Math.random() * 3)
        })),
        kpis: {
          totalRequests: 287,
          delayedRequests: 45,
          onTimeRequests: 230,
          avgDailyDelayed: 6.4,
          avgDailyOnTime: 32.9,
          avgDailyNotUploaded: 1.7,
          mostDelayedHour: '10:00 AM',
          mostDelayedDay: 'Monday'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      period: 'thisMonth',
      shift: 'all',
      hospitalUnit: 'all'
    });
  };

  if (isLoading) {
    return <Loader isLoading={true} />;
  }

  return (
    <div className="min-h-screen bg-background-color">
      <Header
        title="NHL Laboratory Dashboard"
        pageTitle="TAT"
        onLogout={handleLogout}
        onResetFilters={handleResetFilters}
        showResetFilters={true}
        menuItems={[
          { label: 'Export PDF', href: '#', icon: 'fas fa-file-pdf' },
          { label: 'Admin Panel', href: '/admin', icon: 'fas fa-cog' },
          { label: 'Performance Table', href: '/performance', icon: 'fas fa-table' },
          { label: 'Dashboard', href: '/dashboard', icon: 'fas fa-home' }
        ]}
      />

      <Navbar type="chart" />

      <div className="main-search-container">
        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          showLabSectionFilter={false}
          showShiftFilter={true}
          showLaboratoryFilter={true}
          showPeriodFilter={true}
        />
      </div>

      <main className="dashboard-layout">
        <aside className="revenue-progress-card">
          {data && (
            <>
              <TATProgressChart
                currentValue={data.kpis.delayedRequests}
                totalValue={data.kpis.totalRequests}
                title="Total Delayed Requests"
                color="#f44336"
              />
              
              <div style={{ marginTop: '20px' }}>
                <TATProgressChart
                  currentValue={data.kpis.onTimeRequests}
                  totalValue={data.kpis.totalRequests}
                  title="Total On-Time Requests"
                  color="#4caf50"
                />
              </div>
            </>
          )}

          <div className="kpi-grid">
            {data && (
              <>
                <KPICard
                  title="Average Daily On-Time"
                  value={data.kpis.avgDailyOnTime}
                  trend={{ value: -3.2, direction: 'down' }}
                  icon="fas fa-check-circle"
                  suffix=""
                />
                <KPICard
                  title="Average Daily Delays"
                  value={data.kpis.avgDailyDelayed}
                  trend={{ value: 5.7, direction: 'up' }}
                  icon="fas fa-clock"
                  suffix=""
                />
                <KPICard
                  title="Average Daily Not Uploaded"
                  value={data.kpis.avgDailyNotUploaded}
                  trend={{ value: -1.5, direction: 'down' }}
                  icon="fas fa-upload"
                  suffix=""
                />
                <KPICard
                  title="Most Delayed Hour"
                  value={data.kpis.mostDelayedHour}
                  icon="fas fa-hourglass-half"
                />
                <KPICard
                  title="Most Delayed Day"
                  value={data.kpis.mostDelayedDay}
                  fullWidth={true}
                  icon="fas fa-calendar-times"
                />
              </>
            )}
          </div>
        </aside>

        <div className="charts-area">
          <div className="dashboard-charts">
            <div className="performance-chart">
              <div className="chart-title">
                <i className="fas fa-chart-pie mr-2"></i>
                TAT Performance Distribution
              </div>
              <div className="chart-container" style={{ height: '350px' }}>
                {data && <TATPieChart data={data.pieData} />}
              </div>
            </div>
            
            <div className="daily-performance-chart">
              <div className="chart-title">
                <i className="fas fa-chart-line mr-2"></i>
                Daily TAT Performance Trend
              </div>
              <div className="chart-container" style={{ height: '350px' }}>
                {data && <TATLineChart data={data.dailyTrend} />}
              </div>
            </div>
            
            <div className="hourly-performance-chart">
              <div className="chart-title">
                <i className="fas fa-clock mr-2"></i>
                Hourly TAT Performance Trend
              </div>
              <div className="chart-container" style={{ height: '350px' }}>
                {data && <TATHourlyChart data={data.hourlyTrend} />}
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

export default TAT;