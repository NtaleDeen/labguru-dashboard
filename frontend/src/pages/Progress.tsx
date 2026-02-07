import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import ProgressTable from '../components/tables/ProgressTable';
import Filters from '../components/shared/Filters';
import Loader from '../components/shared/Loader';
import { useFilters } from '../hooks/useFilters';
import api from '../services/api';

const Progress: React.FC = () => {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/progress', { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Progress Table" />

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <a href="/reception" className="px-6 py-3 font-medium text-gray-600 hover:text-primary hover:bg-gray-50">
              Reception
            </a>
            <a href="/meta" className="px-6 py-3 font-medium text-gray-600 hover:text-primary hover:bg-gray-50">
              Meta
            </a>
            <a href="/progress" className="px-6 py-3 font-medium bg-primary text-white border-b-2 border-primary">
              Progress
            </a>
            <a href="/tracker" className="px-6 py-3 font-medium text-gray-600 hover:text-primary hover:bg-gray-50">
              Tracker
            </a>
          </div>
        </div>
      </nav>

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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Test Progress Overview
                </h2>
                <span className="text-sm text-gray-500">
                  Auto-refreshes every 30 seconds
                </span>
              </div>
              <ProgressTable data={data} />
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>&copy; 2025 Zyntel</p>
        </div>
      </footer>
    </div>
  );
};

export default Progress;