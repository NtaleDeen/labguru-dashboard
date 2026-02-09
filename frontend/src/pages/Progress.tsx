// frontend/src/pages/Progress.tsx
import React, { useState, useEffect } from 'react';
import { Header, Navbar, Filters, Loader } from '@/components/shared';
import { ProgressTable, type ProgressRecord } from '@/components/tables';

const Progress: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'custom',
    labSection: 'all',
    shift: 'all',
    hospitalUnit: 'all',
    status: 'all'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ProgressRecord[]>([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with API call
      const mockData: ProgressRecord[] = [
        {
          id: 1,
          date: '2025-01-15',
          shift: 'Morning',
          labNumber: 'LAB-2025-001',
          unit: 'A&E',
          timeIn: '08:30',
          dailyTAT: 45,
          timeExpected: '09:15',
          progress: 'completed',
          progressPercentage: 100
        },
        {
          id: 2,
          date: '2025-01-15',
          shift: 'Morning',
          labNumber: 'LAB-2025-002',
          unit: 'ICU',
          timeIn: '09:15',
          dailyTAT: 90,
          timeExpected: '10:45',
          progress: 'in-progress',
          progressPercentage: 60
        },
        {
          id: 3,
          date: '2025-01-15',
          shift: 'Evening',
          labNumber: 'LAB-2025-003',
          unit: 'NICU',
          timeIn: '14:30',
          dailyTAT: 120,
          timeExpected: '16:30',
          progress: 'pending',
          progressPercentage: 0
        },
        {
          id: 4,
          date: '2025-01-14',
          shift: 'Night',
          labNumber: 'LAB-2025-004',
          unit: 'GW A',
          timeIn: '22:15',
          dailyTAT: 180,
          timeExpected: '01:15',
          progress: 'completed',
          progressPercentage: 100
        },
        {
          id: 5,
          date: '2025-01-14',
          shift: 'Morning',
          labNumber: 'LAB-2025-005',
          unit: 'THEATRE',
          timeIn: '07:45',
          dailyTAT: 30,
          timeExpected: '08:15',
          progress: 'in-progress',
          progressPercentage: 80
        }
      ];
      
      // Apply filters
      let filteredData = mockData;
      
      if (filters.status !== 'all') {
        filteredData = filteredData.filter(item => 
          filters.status === 'active' 
            ? item.progress !== 'completed'
            : item.progress === filters.status
        );
      }
      
      setData(filteredData);
      setTimeout(() => setIsLoading(false), 1000);
    } catch (error) {
      console.error('Error fetching progress data:', error);
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
      labSection: 'all',
      shift: 'all',
      hospitalUnit: 'all',
      status: 'all'
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
        pageTitle="Progress Table"
        onLogout={handleLogout}
        onResetFilters={handleResetFilters}
        showResetFilters={true}
        menuItems={[
          { label: 'Export CSV', href: '#', icon: 'fas fa-file-csv', onClick: handleExportCSV },
          { label: 'Admin Panel', href: '/admin', icon: 'fas fa-cog' },
          { label: 'Reception Table', href: '/reception', icon: 'fas fa-table' },
          { label: 'Performance Table', href: '/performance', icon: 'fas fa-chart-line' },
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
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <i className="fas fa-search search-icon"></i>
          </div>
        </div>
        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          showPeriodFilter={true}
          showLabSectionFilter={true}
          showShiftFilter={true}
          showLaboratoryFilter={true}
        />
      </div>

      <main>
        {isLoading ? (
          <Loader isLoading={true} />
        ) : (
          <section className="card">
            <ProgressTable
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

export default Progress;