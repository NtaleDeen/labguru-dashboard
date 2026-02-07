import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import Navbar from '../components/shared/Navbar';
import Filters from '../components/shared/Filters';
import Loader from '../components/shared/Loader';
import { useFilters } from '../hooks/useFilters';
import api from '../services/api';
import { formatPercentage } from '../utils/formatters';

interface TATData {
  totalTests: number;
  delayedTests: number;
  onTimeTests: number;
  notUploadedTests: number;
  delayedPercentage: number;
  onTimePercentage: number;
  avgDailyDelayed: number;
  avgDailyOnTime: number;
  avgDailyNotUploaded: number;
  mostDelayedHour: string;
  mostDelayedDay: string;
  dailyTrend: { date: string; delayed: number; onTime: number; notUploaded: number }[];
  hourlyTrend: { hour: number; delayed: number; onTime: number }[];
}

const TAT: React.FC = () => {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [data, setData] = useState<TATData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTATData();
  }, [filters]);

  const fetchTATData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/tat', { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching TAT data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="TAT Analytics" />
        <Navbar />
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="TAT Analytics" />
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
            {/* Left Sidebar - TAT Summary */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24 space-y-6">
                {/* Delayed Summary */}
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-2">Total Delayed Requests</div>
                  <div className="text-5xl font-bold text-danger mb-4">
                    {formatPercentage(data.delayedPercentage)}
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-gray-800">
                      {data.delayedTests}
                    </div>
                    <div className="text-sm text-gray-500">
                      of {data.totalTests} requests
                    </div>
                  </div>
                </div>

                {/* On-Time Summary */}
                <div className="text-center pt-6 border-t">
                  <div className="text-sm text-gray-600 mb-2">Total On-Time Requests</div>
                  <div className="text-5xl font-bold text-success mb-4">
                    {formatPercentage(data.onTimePercentage)}
                  </div>
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-gray-800">
                      {data.onTimeTests}
                    </div>
                    <div className="text-sm text-gray-500">
                      of {data.totalTests} requests
                    </div>
                  </div>
                </div>

                {/* KPIs */}
                <div className="pt-6 border-t space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">
                      Average Daily On-Time
                    </div>
                    <div className="text-xl font-bold text-success">
                      {Math.round(data.avgDailyOnTime)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">
                      Average Daily Delays
                    </div>
                    <div className="text-xl font-bold text-danger">
                      {Math.round(data.avgDailyDelayed)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">
                      Average Daily Not Uploaded
                    </div>
                    <div className="text-xl font-bold text-warning">
                      {Math.round(data.avgDailyNotUploaded)}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">
                      Most Delayed Hour
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {data.mostDelayedHour || 'N/A'}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-xs text-gray-600 mb-1">
                      Most Delayed Day
                    </div>
                    <div className="text-sm font-bold text-gray-800">
                      {data.mostDelayedDay || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Charts Placeholder */}
            <div className="lg:col-span-3 space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  TAT Performance Distribution
                </h2>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Chart will be rendered here
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Daily TAT Performance Trend
                </h2>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  Chart will be rendered here
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Hourly TAT Performance Trend
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

export default TAT;