import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import Navbar from '../components/shared/Navbar';
import Filters from '../components/shared/Filters';
import Loader from '../components/shared/Loader';
import { useFilters } from '../hooks/useFilters';
import api from '../services/api';

interface NumbersData {
  totalRequests: number;
  avgDailyRequests: number;
  busiestHour: string;
  busiestDay: string;
  dailyVolume: { date: string; count: number }[];
  hourlyVolume: { hour: number; count: number }[];
}

const Numbers: React.FC = () => {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [data, setData] = useState<NumbersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNumbersData();
  }, [filters]);

  const fetchNumbersData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/numbers', { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching numbers data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Numbers Analytics" />
        <Navbar />
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Numbers Analytics" />
      <Navbar />

      <main className="container mx-auto px-4 py-6">
        <Filters
          filters={filters}
          onFilterChange={updateFilter}
          onReset={resetFilters}
        />

        {isLoading ? (
          <Loader />
        ) : data ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - KPIs */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24 space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">
                    Total Requests
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {data.totalRequests.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">
                    Average Daily Requests
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(data.avgDailyRequests).toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">
                    Busiest Hour
                  </div>
                  <div className="text-lg font-bold text-gray-800">
                    {data.busiestHour || 'N/A'}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">
                    Busiest Day
                  </div>
                  <div className="text-sm font-bold text-gray-800">
                    {data.busiestDay || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Charts */}
            <div className="lg:col-span-3 space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Daily Request Volume
                </h2>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Chart will be rendered here
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Hourly Request Volume
                </h2>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Chart will be rendered here
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            No data available
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>&copy; 2025 Zyntel</p>
        </div>
      </footer>
    </div>
  );
};

export default Numbers;