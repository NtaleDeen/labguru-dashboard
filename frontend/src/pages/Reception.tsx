import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import Filters from '../components/shared/Filters';
import ReceptionTable from '../components/tables/ReceptionTable';
import Loader from '../components/shared/Loader';
import { useFilters } from '../hooks/useFilters';
import { useSocket as useSocketHook } from '../hooks/useSocket';
import { TestRecord } from '../types';
import api from '../services/api';
import { joinReception } from '../services/socket';

const Reception: React.FC = () => {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [data, setData] = useState<TestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    joinReception();
  }, [filters]);

  // Real-time updates
  useSocketHook('test-updated', (updatedTest: TestRecord) => {
    setData((prev) =>
      prev.map((test) => (test.id === updatedTest.id ? updatedTest : test))
    );
  });

  useSocketHook('test-cancelled', (cancelledTest: TestRecord) => {
    setData((prev) =>
      prev.map((test) => (test.id === cancelledTest.id ? cancelledTest : test))
    );
  });

  useSocketHook('data-updated', () => {
    fetchData();
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/reception', { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching reception data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, updates: any) => {
    try {
      const response = await api.put(`/reception/${id}/status`, updates);
      setData((prev) =>
        prev.map((test) => (test.id === id ? response.data : test))
      );
    } catch (error) {
      console.error('Error updating test status:', error);
    }
  };

  const handleCancelTest = async (id: number, reason: string) => {
    try {
      const response = await api.post(`/reception/${id}/cancel`, { reason });
      setData((prev) =>
        prev.map((test) => (test.id === id ? response.data : test))
      );
    } catch (error) {
      console.error('Error cancelling test:', error);
    }
  };

  const handleBulkUpdate = async (testIds: number[], action: string) => {
    try {
      await api.post('/reception/bulk-update', { testIds, action });
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error bulk updating tests:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
      <Header title="Reception Table" />

      <main className="container mx-auto px-4 py-6">
        <Filters
          filters={filters}
          onFilterChange={updateFilter}
          onReset={resetFilters}
        />

        <div className="mt-6">
          {isLoading ? (
            <Loader />
          ) : (
            <div className="card">
              <ReceptionTable
                data={data}
                onUpdateStatus={handleUpdateStatus}
                onCancelTest={handleCancelTest}
                onBulkUpdate={handleBulkUpdate}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="bg-primary/80 backdrop-blur-sm border-t border-highlight/20 py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>&copy; 2025 Zyntel</p>
        </div>
      </footer>
    </div>
  );
};

export default Reception;