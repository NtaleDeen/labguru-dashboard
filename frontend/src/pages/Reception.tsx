// frontend/src/pages/Reception.tsx
import React, { useState, useEffect } from 'react';
import { Header, Navbar, Filters, Loader } from '@/components/shared';
import { ReceptionTable, type ReceptionRecord } from '@/components/tables';

const Reception: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    period: 'custom',
    labSection: 'all',
    shift: 'all',
    hospitalUnit: 'all',
    search: ''
  });
  
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ReceptionRecord[]>([]);

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
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/reception?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reception data');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching reception data:', error);
      setData([]);
    } finally {
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

  const handleSelectRow = (id: number) => {
    setSelectedTests(prev =>
      prev.includes(id)
        ? prev.filter(testId => testId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTests(data.map(item => item.id));
    } else {
      setSelectedTests([]);
    }
  };

  const handleUrgentClick = (id: number, currentUrgency: 'routine' | 'urgent') => {
    const newUrgency = currentUrgency === 'routine' ? 'urgent' : 'routine';
    console.log(`Marked test ${id} as ${newUrgency}`);
    // Update data here
  };

  const handleReceiveClick = (id: number) => {
    console.log(`Received test ${id}`);
    // Update data here
  };

  const handleResultClick = (id: number) => {
    console.log(`Result entered for test ${id}`);
    // Update data here
  };

  const handleExportCSV = () => {
    console.log('Exporting CSV...');
    // CSV export logic here
  };

  const handleMultiUrgent = () => {
    console.log('Marking selected as urgent:', selectedTests);
    // Batch update logic here
  };

  const handleMultiReceive = () => {
    console.log('Receiving selected:', selectedTests);
    // Batch update logic here
  };

  const handleMultiResult = () => {
    console.log('Resulting selected:', selectedTests);
    // Batch update logic here
  };

  return (
    <div className="min-h-screen bg-background-color">
      <Header
        title="Nakasero Hospital Laboratory"
        pageTitle="Reception Table"
        onLogout={handleLogout}
        onResetFilters={handleResetFilters}
        showResetFilters={true}
        menuItems={[
          { label: 'Export CSV', href: '#', icon: 'fas fa-file-csv', onClick: handleExportCSV },
          { label: 'Admin Panel', href: '/admin', icon: 'fas fa-cog' },
          { label: 'Progress Table', href: '/progress', icon: 'fas fa-table' },
          { label: 'Performance Table', href: '/performance', icon: 'fas fa-chart-line' },
          { label: 'Tracker Table', href: '/tracker', icon: 'fas fa-list' },
          { label: 'Meta Table', href: '/meta', icon: 'fas fa-database' },
          { label: 'Dashboard', href: '/dashboard', icon: 'fas fa-home' }
        ]}
      />

      <Navbar type="table" />

      <div className="main-search-container">
        <div className="search-actions-row">
          <div className={`multi-select-container ${selectedTests.length === 0 ? 'hidden' : ''}`}>
            <button 
              className="multi-action-button urgent"
              onClick={handleMultiUrgent}
            >
              Mark as Urgent
            </button>
            <button 
              className="multi-action-button receive"
              onClick={handleMultiReceive}
            >
              Receive Selected
            </button>
            <button 
              className="multi-action-button result"
              onClick={handleMultiResult}
            >
              Result Selected
            </button>
          </div>
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
            <ReceptionTable
              data={data}
              selectedIds={selectedTests}
              onSelectRow={handleSelectRow}
              onSelectAll={handleSelectAll}
              onUrgentClick={handleUrgentClick}
              onReceiveClick={handleReceiveClick}
              onResultClick={handleResultClick}
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

export default Reception;