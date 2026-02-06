import React, { useState, useEffect } from 'react';
import { revenueAPI } from '../services/api';
import { DashboardStats, DailyRevenue, SectionRevenue, TestRevenue } from '../types';
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '../utils/formatters';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [sectionRevenue, setSectionRevenue] = useState<SectionRevenue[]>([]);
  const [topTests, setTopTests] = useState<TestRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedSection, setSelectedSection] = useState<string>('');

  const COLORS = ['#21336a', '#deab5f', '#3b5998', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  useEffect(() => {
    fetchAllData();
  }, [dateRange, selectedSection]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(selectedSection && { labSection: selectedSection }),
      };

      const [statsRes, dailyRes, sectionRes, topTestsRes] = await Promise.all([
        revenueAPI.getStats(params),
        revenueAPI.getDailyRevenue(params),
        revenueAPI.getSectionRevenue(params),
        revenueAPI.getTopTests({ ...params, limit: 10 }),
      ]);

      setStats(statsRes.data.data);
      setDailyRevenue(dailyRes.data.data);
      setSectionRevenue(sectionRes.data.data);
      setTopTests(topTestsRes.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setQuickDateRange = (days: number) => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDateRange({ startDate, endDate });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" style={{ color: '#21336a' }}>Revenue Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setQuickDateRange(7)}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setQuickDateRange(30)}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setQuickDateRange(90)}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Lab Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Sections</option>
            {sectionRevenue.map((section) => (
              <option key={section.lab_section} value={section.lab_section}>
                {section.lab_section}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: '4px solid #21336a' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#21336a' }}>
                {stats ? formatCurrency(stats.totalRevenue) : '...'}
              </p>
              {stats && stats.periodComparison.percentageChange !== 0 && (
                <p className={`text-sm mt-1 ${stats.periodComparison.percentageChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.periodComparison.percentageChange > 0 ? '↑' : '↓'} {formatPercentage(Math.abs(stats.periodComparison.percentageChange))}
                </p>
              )}
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#21336a20' }}>
              <svg className="w-8 h-8" style={{ color: '#21336a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: '4px solid #deab5f' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#deab5f' }}>
                {stats ? formatNumber(stats.totalTests) : '...'}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#deab5f20' }}>
              <svg className="w-8 h-8" style={{ color: '#deab5f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: '4px solid #3b5998' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Price</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#3b5998' }}>
                {stats ? formatCurrency(stats.averagePrice) : '...'}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#3b599820' }}>
              <svg className="w-8 h-8" style={{ color: '#3b5998' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6" style={{ borderTop: '4px solid #82ca9d' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Top Section</p>
              <p className="text-xl font-bold mt-1" style={{ color: '#82ca9d' }}>
                {stats?.topSection || 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: '#82ca9d20' }}>
              <svg className="w-8 h-8" style={{ color: '#82ca9d' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4" style={{ color: '#21336a' }}>Daily Revenue Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(date) => formatDate(date)} />
            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
            <Tooltip
              formatter={(value: any) => formatCurrency(value)}
              labelFormatter={(label) => formatDate(label)}
            />
            <Legend />
            <Line type="monotone" dataKey="total_revenue" name="Revenue" stroke="#21336a" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Section Revenue & Top Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Revenue Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#21336a' }}>Revenue by Section</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sectionRevenue}
                dataKey="total_revenue"
                nameKey="lab_section"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.lab_section}: ${formatCurrency(entry.total_revenue)}`}
              >
                {sectionRevenue.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Tests Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#21336a' }}>Top 10 Tests by Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topTests} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
              <YAxis dataKey="test_name" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="total_revenue" fill="#deab5f" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Tests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold" style={{ color: '#21336a' }}>Top Tests Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topTests.map((test, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{test.test_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.lab_section}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(test.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(test.test_count)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold" style={{ color: '#21336a' }}>
                    {formatCurrency(test.total_revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;