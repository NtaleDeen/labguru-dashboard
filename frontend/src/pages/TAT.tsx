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
      // Mock data - replace with API call
      const mockData: TATData = {
        pieData: {
          delayed: 45,
          onTime: 120,
          notUploaded: 10
        },
        dailyTrend: Array.from({ length: 7 }, (_, i) => ({
          date: `2025-01-0${i + 1}`,
          delayed: Math.floor(Math.random() * 20) + 5,
          onTime: Math.floor(Math.random() * 50) + 30,
          notUploaded: Math.floor(Math.random() * 10) + 1
        })),
        hourlyTrend: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          delayed: Math.floor(Math.random() * 15) + 1,
          onTime: Math.floor(Math.random() * 40) + 10,
          notUploaded: Math.floor(Math.random() * 5) + 0
        })),
        kpis: {
          totalRequests: 7850,
          delayedRequests: 850,
          onTimeRequests: 6500,
          avgDailyDelayed: 28.3,
          avgDailyOnTime: 216.7,
          avgDailyNotUploaded: 8.3,
          mostDelayedHour: '14:00 (45 samples)',
          mostDelayedDay: 'Jan 15, 2025 (65 samples)'
        }
      };
      
      setData(mockData);
      setTimeout(() => setIsLoading(false), 1000);
    } catch (error) {
      console.error('Error fetching TAT data:', error);
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    window.location.href = '/';
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
                />
                <KPICard
                  title="Average Daily Delays"
                  value={data.kpis.avgDailyDelayed}
                  trend={{ value: 5.7, direction: 'up' }}
                  icon="fas fa-clock"
                />
                <KPICard
                  title="Average Daily Not Uploaded"
                  value={data.kpis.avgDailyNotUploaded}
                  trend={{ value: -1.5, direction: 'down' }}
                  icon="fas fa-upload"
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
              <div className="chart-title">TAT Performance Distribution</div>
              <div className="chart-container">
                {data && <TATPieChart {...data.pieData} />}
              </div>
            </div>
            
            <div className="daily-performance-chart">
              <div className="chart-title">Daily TAT Performance Trend</div>
              <div className="chart-container">
                {data && <TATLineChart data={data.dailyTrend} />}
              </div>
            </div>
            
            <div className="hourly-performance-chart">
              <div className="chart-title">Hourly TAT Performance Trend</div>
              <div className="chart-container">
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