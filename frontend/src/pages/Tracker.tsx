// frontend/src/pages/Tracker.tsx
import React, { useState, useEffect } from 'react';
import { Header, Navbar, Filters, Loader } from '@/components/shared';
import { TrackerTable, type TrackerRecord } from '@/components/tables';

const Tracker: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'custom',
    labSection: 'all',
    shift: 'all',
    hospitalUnit: 'all',
    search: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<TrackerRecord[]>([]);

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with API call
      const mockData: TrackerRecord[] = [
        {
          id: 1,
          date: '2025-01-15',
          shift: 'Morning',
          labNumber: 'LAB-2025-001',
          unit: 'A&E',
          labSection: 'Chemistry',
          testName: 'CBC with Differential',
          timeIn: '08:30',
          urgency: 'routine',
          timeReceived: '08:35',
          tat: 45,
          timeExpected: '09:20',
          progress: 'completed',
          timeOut: '09:15'
        },
        {
          id: 2,
          date: '2025-01-15',
          shift: 'Morning',
          labNumber: 'LAB-2025-002',
          unit: 'ICU',
          labSection: 'Hematology',
          testName: 'LFT Comprehensive',
          timeIn: '09:15',
          urgency: 'urgent',
          timeReceived: '09:20',
          tat: 90,
          timeExpected: '10:50',
          progress: 'in-progress',
          timeOut: ''
        },
        {
          id: 3,
          date: '2025-01-15',
          shift: 'Evening',
          labNumber: 'LAB-2025-003',
          unit: 'NICU',
          labSection: 'Microbiology',
          testName: 'Blood Culture',
          timeIn: '14:30',
          urgency: 'routine',
          timeReceived: '14:35',
          tat: 180,
          timeExpected: '17:30',
          progress: 'pending',
          timeOut: ''
        },
        {
          id: 4,
          date: '2025-01-14',
          shift: 'Night',
          labNumber: 'LAB-2025-004',
          unit: 'GW A',
          labSection: 'Immunology',
          testName: 'HIV Viral Load',
          timeIn: '22:15',
          urgency: 'urgent',
          timeReceived: '22:20',
          tat: 240,
          timeExpected: '02:20',
          progress: 'completed',
          timeOut: '02:10'
        },
        {
          id: 5,
          date: '2025-01-14',
          shift: 'Morning',
          labNumber: 'LAB-2025-005',
          unit: 'THEATRE',
          labSection: 'Chemistry',
          testName: 'RFT',
          timeIn: '07:45',
          urgency: 'routine',
          timeReceived: '07:50',
          tat: 30,
          timeExpected: '08:20',
          progress: 'in-progress',
          timeOut: ''
        }
      ];
      
      // Apply search filter
      let filteredData = mockData;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = mockData.filter(item =>
          item.labNumber.toLowerCase().includes(searchLower) ||
          item.testName.toLowerCase().includes(searchLower) ||
          item.unit.toLowerCase().includes(searchLower)
        );
      }
      
      setData(filteredData);
      setTimeout(() => setIsLoading(false), 1000);
    } catch (error) {
      console.error('Error fetching tracker data:', error);
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
        pageTitle="Tracker Table"
        onLogout={handleLogout}
        onResetFilters={handleResetFilters}
        showResetFilters={true}
        menuItems={[
          { label: 'Export CSV', href: '#', icon: 'fas fa-file-csv', onClick: handleExportCSV },
          { label: 'Admin Panel', href: '/admin', icon: 'fas fa-cog' },
          { label: 'Reception Table', href: '/reception', icon: 'fas fa-table' },
          { label: 'Progress Table', href: '/progress', icon: 'fas fa-chart-bar' },
          { label: 'Performance Table', href: '/performance', icon: 'fas fa-chart-line' },
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
            <TrackerTable
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

export default Tracker;