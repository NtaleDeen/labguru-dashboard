// frontend/src/pages/Performance.tsx
import React, { useState, useEffect } from 'react';
import { Header, Navbar, Filters, Loader } from '@/components/shared';
import { PerformanceTable, type PerformanceRecord } from '@/components/tables';

const Performance: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'custom',
    shift: 'all',
    laboratory: 'all',
    search: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PerformanceRecord[]>([]);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with API call
      const mockData: PerformanceRecord[] = [
        {
          id: 101,
          date: '2025-01-15',
          shift: 'Morning',
          labNumber: 'LAB-2025-001',
          unit: 'A&E',
          timeIn: '08:30',
          dailyTAT: 45,
          timeExpected: '09:15',
          timeOut: '09:10',
          delayStatus: 'on-time',
          timeRange: '08:30 - 09:10'
        },
        {
          id: 102,
          date: '2025-01-15',
          shift: 'Morning',
          labNumber: 'LAB-2025-002',
          unit: 'ICU',
          timeIn: '09:15',
          dailyTAT: 120,
          timeExpected: '11:15',
          timeOut: '11:45',
          delayStatus: 'delayed',
          timeRange: '09:15 - 11:45'
        },
        {
          id: 103,
          date: '2025-01-15',
          shift: 'Evening',
          labNumber: 'LAB-2025-003',
          unit: 'NICU',
          timeIn: '14:30',
          dailyTAT: 180,
          timeExpected: '17:30',
          timeOut: '18:30',
          delayStatus: 'over-delayed',
          timeRange: '14:30 - 18:30'
        },
        {
          id: 104,
          date: '2025-01-14',
          shift: 'Night',
          labNumber: 'LAB-2025-004',
          unit: 'GW A',
          timeIn: '22:15',
          dailyTAT: 240,
          timeExpected: '02:15',
          timeOut: '02:10',
          delayStatus: 'on-time',
          timeRange: '22:15 - 02:10'
        },
        {
          id: 105,
          date: '2025-01-14',
          shift: 'Morning',
          labNumber: 'LAB-2025-005',
          unit: 'THEATRE',
          timeIn: '07:45',
          dailyTAT: 30,
          timeExpected: '08:15',
          timeOut: '08:05',
          delayStatus: 'on-time',
          timeRange: '07:45 - 08:05'
        }
      ];
      
      // Apply search filter
      let filteredData = mockData;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = mockData.filter(item =>
          item.labNumber.toLowerCase().includes(searchLower) ||
          item.unit.toLowerCase().includes(searchLower)
        );
      }
      
      setData(filteredData);
      setTimeout(() => setIsLoading(false), 1000);
    } catch (error) {
      console.error('Error fetching performance data:', error);
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
      period: 'custom',
      shift: 'all',
      laboratory: 'all',
      search: ''
    });
  };

  const handleExportCSV = () => {
    console.log('Exporting CSV...');
    // CSV export logic here
  };

  return (
    <div className="min-h-screen bg-background-color">
      <Header
        title="Nakasero Hospital Laboratory"
        pageTitle="Performance Table"
        onLogout={handleLogout}
        onResetFilters={handleResetFilters}
        showResetFilters={true}
        menuItems={[
          { label: 'Export CSV', href: '#', icon: 'fas fa-file-csv', onClick: handleExportCSV },
          { label: 'Admin Panel', href: '/admin', icon: 'fas fa-cog' },
          { label: 'Reception Table', href: '/reception', icon: 'fas fa-table' },
          { label: 'Progress Table', href: '/progress', icon: 'fas fa-chart-bar' },
          { label: 'Tracker Table', href: '/tracker', icon: 'fas fa-list' },
          { label: 'Meta Table', href: '/meta', icon: 'fas fa-database' },
          { label: 'Dashboard', href: '/dashboard', icon: 'fas fa-home' }
        ]}
      />

      <Navbar type="table" />

      <div className="main-search-container">
        <div className="search-actions-row">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search test / lab Number..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <i className="fas fa-search search-icon"></i>
          </div>
        </div>
        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          showPeriodFilter={true}
          showLabSectionFilter={false}
          showShiftFilter={true}
          showLaboratoryFilter={true}
        />
      </div>

      <main>
        {isLoading ? (
          <Loader isLoading={true} />
        ) : (
          <section className="card">
            <PerformanceTable
              data={data}
              isLoading={isLoading}
            />
          </section>
        )}
      </main>

      <div className="notice">
        <p>Sorry! You need a wider screen to view the table.</p>
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