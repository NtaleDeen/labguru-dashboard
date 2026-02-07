import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import Navbar from '../components/shared/Navbar';
import Filters from '../components/shared/Filters';
import Loader from '../components/shared/Loader';
import { useFilters } from '../hooks/useFilters';
import api from '../services/api';

interface TestsData {
  totalTestsPerformed: number;
  avgDailyTests: number;
  testVolumeTrend: { date: string; count: number }[];
  topTestsByUnit: { [unit: string]: { test_name: string; count: number }[] };
}

const Tests: React.FC = () => {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [data, setData] = useState<TestsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  useEffect(() => {
    fetchTestsData();
  }, [filters]);

  const fetchTestsData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/tests', { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching tests data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Tests Analytics" />
        <Navbar />
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Tests Analytics" />
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
                    Total Tests Performed
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {data.totalTestsPerformed.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">
                    Avg. Daily Tests
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(data.avgDailyTests).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Charts */}
            <div className="lg:col-span-3 space-y-6">
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    Top Tests by Unit
                  </h2>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-48"
                  >
                    <option value="all">All Units</option>
                    {data.topTestsByUnit && Object.keys(data.topTestsByUnit).map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="h-96 flex items-center justify-center text-gray-400">
                  Chart will be rendered here
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Test Volume Trend
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

export default Tests;