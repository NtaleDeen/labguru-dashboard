// frontend/src/pages/LRIDS.tsx
import React, { useState, useEffect } from 'react';
import { Header, Loader } from '@/components/shared';
import { LRIDSTable, type LRIDSRecord } from '@/components/tables';

const LRIDS: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<LRIDSRecord[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      // Mock data - replace with API call
      const mockData: LRIDSRecord[] = [
        {
          id: 1,
          timestamp: '2025-01-15T08:30:00',
          labNumber: 'LAB-2025-001',
          patientName: 'John Doe',
          testName: 'CBC with Differential',
          status: 'completed',
          labSection: 'Hematology',
          technician: 'Dr. Smith',
          updatedAt: '2025-01-15T09:15:00'
        },
        {
          id: 2,
          timestamp: '2025-01-15T09:15:00',
          labNumber: 'LAB-2025-002',
          patientName: 'Jane Smith',
          testName: 'LFT Comprehensive',
          status: 'processing',
          labSection: 'Chemistry',
          technician: 'Dr. Johnson',
          updatedAt: '2025-01-15T09:45:00'
        },
        {
          id: 3,
          timestamp: '2025-01-15T10:30:00',
          labNumber: 'LAB-2025-003',
          patientName: 'Robert Brown',
          testName: 'Blood Culture',
          status: 'received',
          labSection: 'Microbiology',
          technician: 'Dr. Williams',
          updatedAt: '2025-01-15T10:35:00'
        },
        {
          id: 4,
          timestamp: '2025-01-15T11:45:00',
          labNumber: 'LAB-2025-004',
          patientName: 'Maria Garcia',
          testName: 'HIV Viral Load',
          status: 'processing',
          labSection: 'Molecular',
          technician: 'Dr. Miller',
          updatedAt: '2025-01-15T12:30:00'
        },
        {
          id: 5,
          timestamp: '2025-01-15T14:00:00',
          labNumber: 'LAB-2025-005',
          patientName: 'David Wilson',
          testName: 'Thyroid Profile',
          status: 'completed',
          labSection: 'Chemistry',
          technician: 'Dr. Davis',
          updatedAt: '2025-01-15T15:30:00'
        },
        {
          id: 6,
          timestamp: '2025-01-15T16:30:00',
          labNumber: 'LAB-2025-006',
          patientName: 'Sarah Taylor',
          testName: 'Lipid Profile',
          status: 'cancelled',
          labSection: 'Chemistry',
          technician: 'Dr. Moore',
          updatedAt: '2025-01-15T17:00:00'
        },
        {
          id: 7,
          timestamp: '2025-01-15T18:00:00',
          labNumber: 'LAB-2025-007',
          patientName: 'Michael Clark',
          testName: 'Malaria Parasite',
          status: 'processing',
          labSection: 'Microbiology',
          technician: 'Dr. White',
          updatedAt: '2025-01-15T18:30:00'
        },
        {
          id: 8,
          timestamp: '2025-01-15T20:15:00',
          labNumber: 'LAB-2025-008',
          patientName: 'Lisa Martinez',
          testName: 'Dengue NS1',
          status: 'received',
          labSection: 'Immunology',
          technician: 'Dr. Lee',
          updatedAt: '2025-01-15T20:20:00'
        }
      ];
      
      setData(mockData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching LRIDS data:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('Logout clicked');
    window.location.href = '/';
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleExportCSV = () => {
    console.log('Exporting CSV...');
    // CSV export logic here
  };

  return (
    <div className="min-h-screen bg-background-color">
      <Header
        title="Nakasero Hospital Laboratory"
        pageTitle="Live Results & IDS"
        onLogout={handleLogout}
        showResetFilters={false}
        menuItems={[
          { label: 'Export CSV', href: '#', icon: 'fas fa-file-csv', onClick: handleExportCSV },
          { label: 'Dashboard', href: '/dashboard', icon: 'fas fa-home' }
        ]}
      />

      <main className="p-6">
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-main-color">Live Results & IDS Dashboard</h2>
              <p className="text-sm text-gray-600 mt-1">Real-time tracking of laboratory test progress</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={toggleAutoRefresh}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}
              >
                <i className={`fas ${autoRefresh ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                <span>Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-main-color text-white rounded-md hover:bg-hover-color flex items-center space-x-2"
              >
                <i className="fas fa-sync-alt"></i>
                <span>Refresh Now</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <Loader isLoading={true} />
          ) : (
            <LRIDSTable
              data={data}
              isLoading={isLoading}
              autoRefresh={autoRefresh}
              refreshInterval={30000}
            />
          )}
        </div>
      </main>

      <footer>
        <p>&copy;2025 Zyntel</p>
        <div className="zyntel">
          <img src="/images/zyntel_no_background.png" alt="logo" />
        </div>
      </footer>
    </div>
  );
};

export default LRIDS;