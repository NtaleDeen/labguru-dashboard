import React, { useState, useEffect } from 'react';
import Header from '../components/shared/Header';
import Navbar from '../components/shared/Navbar';
import Filters from '../components/shared/Filters';
import DailyRevenueChart from '../components/charts/DailyRevenueChart';
import SectionRevenueChart from '../components/charts/SectionRevenueChart';
import TestRevenueChart from '../components/charts/TestRevenueChart';
import HospitalUnitChart from '../components/charts/HospitalUnitChart';
import Loader from '../components/shared/Loader';
import { useFilters } from '../hooks/useFilters';
import { RevenueData } from '../types';
import api from '../services/api';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const Revenue: React.FC = () => {
  const { filters, updateFilter, resetFilters } = useFilters();
  const [data, setData] = useState<RevenueData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, [filters]);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/revenue', { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
        <Header title="Revenue Analytics" />
        <Navbar />
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent">
      <Header title="Revenue Analytics" />
      <Navbar />

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <Filters
          filters={filters}
          onFilterChange={updateFilter}
          onReset={resetFilters}
        />

        {isLoading ? (
          <Loader />
        ) : data ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Revenue Progress */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Total Revenue</div>
                  <div className="text-5xl font-bold text-highlight neon-glow mb-4">
                    {formatPercentage(data.percentage)}
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-highlight to-neon-blue transition-all duration-500"
                        style={{ width: `${Math.min(data.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(data.totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-400">
                      of {formatCurrency(data.targetRevenue)}
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="mt-6 space-y-4">
                    <div className="bg-accent/30 p-4 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">
                        Avg. Daily Revenue
                      </div>
                      <div className="text-xl font-bold text-white">
                        {formatCurrency(data.avgDailyRevenue)}
                      </div>
                    </div>

                    <div className="bg-accent/30 p-4 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">
                        Revenue Growth Rate
                      </div>
                      <div
                        className={`text-xl font-bold ${
                          data.revenueGrowthRate >= 0
                            ? 'text-success'
                            : 'text-danger'
                        }`}
                      >
                        {data.revenueGrowthRate >= 0 ? '+' : ''}
                        {formatPercentage(data.revenueGrowthRate)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Charts */}
            <div className="lg:col-span-3 space-y-6">
              {/* Daily Revenue */}
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">
                  Daily Revenue
                </h2>
                <DailyRevenueChart data={data.dailyRevenue} />
              </div>

              {/* Revenue by Section */}
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">
                  Revenue by Laboratory Section
                </h2>
                <SectionRevenueChart data={data.sectionRevenue} />
              </div>

              {/* Revenue by Hospital Unit */}
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">
                  Revenue by Hospital Unit
                </h2>
                <HospitalUnitChart data={data.hospitalUnitRevenue} />
              </div>

              {/* Top 50 Tests by Revenue */}
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">
                  Top 50 Tests by Revenue
                </h2>
                <TestRevenueChart data={data.testRevenue} />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            No data available
          </div>
        )}
      </main>

      <footer className="bg-primary/80 backdrop-blur-sm border-t border-highlight/20 py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>&copy; 2025 Zyntel</p>
        </div>
      </footer>
    </div>
  );
};

export default Revenue;