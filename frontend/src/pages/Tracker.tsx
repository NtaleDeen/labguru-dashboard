import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import TrackerTable from '../components/tables/TrackerTable';
import Filters from '../components/shared/Filters';
import Loader from '../components/shared/Loader';
import { useFilters } from '../hooks/useFilters';
import api from '../services/api';

const Tracker: React.FC = () => {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/tracker', { 
        params: { 
          ...filters,
          search: searchTerm 
        } 
      });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching tracker data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Tracker Table" />

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
            <a href="/progress" className="px-6 py-3 font-medium text-gray-600 hover:text-primary hover:bg-gray-50">
              Progress
            </a>
            <a href="/tracker" className="px-6 py-3 font-medium bg-primary text-white border-b-2 border-primary">
              Tracker
            </a>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search test name or lab number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <button onClick={handleSearch} className="btn-primary">
              Search
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            💡 Searching by test name shows all unique lab numbers with that test (deduplicated)
          </p>
        </div>

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
              <TrackerTable data={data} />
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

export default Tracker;