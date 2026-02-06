import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { api } from '../utils/api';
import { formatCurrency, formatDate, getDateRangeForPeriod } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';
import {
  CalendarIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface FilterForm {
  period: string;
  startDate: string;
  endDate: string;
  labSection: string;
  shift: string;
  hospitalUnit: string;
}

const Revenue: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [aggregations, setAggregations] = useState<any>(null);
  const [kpis, setKpis] = useState<any>(null);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(1500000000);
  
  const { register, handleSubmit, watch, setValue } = useForm<FilterForm>({
    defaultValues: {
      period: 'thisMonth',
      labSection: 'all',
      shift: 'all',
      hospitalUnit: 'all',
    },
  });

  const period = watch('period');

  useEffect(() => {
    // Set date range based on period
    if (period !== 'custom') {
      const { start, end } = getDateRangeForPeriod(period);
      setValue('startDate', start);
      setValue('endDate', end);
    }
  }, [period, setValue]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (filters?: FilterForm) => {
    setIsLoading(true);
    try {
      const filterValues = filters || {
        period: 'thisMonth',
        startDate: getDateRangeForPeriod('thisMonth').start,
        endDate: getDateRangeForPeriod('thisMonth').end,
        labSection: 'all',
        shift: 'all',
        hospitalUnit: 'all',
      };

      const [aggregationsRes, kpisRes] = await Promise.all([
        api.getRevenueAggregations({
          start_date: filterValues.startDate,
          end_date: filterValues.endDate,
          labSection: filterValues.labSection !== 'all' ? filterValues.labSection : undefined,
          shift: filterValues.shift !== 'all' ? filterValues.shift : undefined,
          hospitalUnit: filterValues.hospitalUnit !== 'all' ? filterValues.hospitalUnit : undefined,
        }),
        api.getRevenueKPIs({
          start_date: filterValues.startDate,
          end_date: filterValues.endDate,
          labSection: filterValues.labSection !== 'all' ? filterValues.labSection : undefined,
          shift: filterValues.shift !== 'all' ? filterValues.shift : undefined,
          hospitalUnit: filterValues.hospitalUnit !== 'all' ? filterValues.hospitalUnit : undefined,
        }),
      ]);

      setAggregations(aggregationsRes.data);
      setKpis(kpisRes.data);

      // Load monthly target
      const today = new Date();
      const targetRes = await api.getMonthlyTarget(today.getFullYear(), today.getMonth() + 1);
      setMonthlyTarget(targetRes.data.target);

    } catch (error) {
      console.error('Failed to load revenue data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: FilterForm) => {
    loadData(data);
  };

  const getProgressPercentage = () => {
    if (!kpis || monthlyTarget === 0) return 0;
    return (kpis.totalRevenue / monthlyTarget) * 100;
  };

  const COLORS = ['#21336a', '#4CAF50', '#795548', '#9C27B0', '#FF5722', '#00BCD4', '#607D8B', '#deab5f', '#E91E63', '#FFC107'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
            <p className="mt-1 text-gray-600">
              Financial performance and trends
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Period</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(kpis?.totalRevenue || 0)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <select
                {...register('period')}
                className="input-field"
              >
                <option value="today">Today</option>
                <option value="last7Days">Last 7 Days</option>
                <option value="last30Days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="thisQuarter">This Quarter</option>
                <option value="lastQuarter">Last Quarter</option>
                <option value="thisYear">This Year</option>
                <option value="lastYear">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {period === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    {...register('endDate')}
                    className="input-field"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lab Section
              </label>
              <select
                {...register('labSection')}
                className="input-field"
              >
                <option value="all">All Sections</option>
                <option value="chemistry">Chemistry</option>
                <option value="heamatology">Heamatology</option>
                <option value="microbiology">Microbiology</option>
                <option value="serology">Serology</option>
                <option value="referral">Referral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift
              </label>
              <select
                {...register('shift')}
                className="input-field"
              >
                <option value="all">All Shifts</option>
                <option value="Day Shift">Day Shift</option>
                <option value="Night Shift">Night Shift</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital Unit
              </label>
              <select
                {...register('hospitalUnit')}
                className="input-field"
              >
                <option value="all">All Units</option>
                <option value="mainLab">Main Laboratory</option>
                <option value="annex">Annex</option>
                <option value="inpatient">Inpatient Units</option>
                <option value="outpatient">Outpatient Units</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary flex items-center"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(kpis?.totalRevenue || 0)}
              </p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              {kpis?.revenueGrowthRate >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={kpis?.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(kpis?.revenueGrowthRate || 0).toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-2">vs previous period</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Test Volume</p>
              <p className="text-2xl font-bold text-gray-900">
                {kpis?.testCount?.toLocaleString() || 0}
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Avg. {Math.round(kpis?.avgDailyTests || 0)} tests/day
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Daily Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(kpis?.avgDailyRevenue || 0)}
              </p>
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-purple-500" />
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Over {kpis?.dayCount || 0} days
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Target</p>
              <p className="text-2xl font-bold text-gray-900">
                {getProgressPercentage().toFixed(1)}%
              </p>
            </div>
            <CalendarIcon className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${Math.min(getProgressPercentage(), 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {formatCurrency(kpis?.totalRevenue || 0)} of {formatCurrency(monthlyTarget)}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregations?.dailyRevenue || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value, 'dd-MMM')}
                  stroke="#6b7280"
                />
                <YAxis 
                  tickFormatter={(value) => `UGX ${(value/1000).toFixed(0)}K`}
                  stroke="#6b7280"
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                  labelFormatter={(label) => `Date: ${formatDate(label, 'dd-MMM-yyyy')}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_revenue"
                  stroke="#21336a"
                  strokeWidth={2}
                  name="Revenue"
                  dot={{ stroke: '#21336a', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Lab Section */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Lab Section</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={aggregations?.bySection || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_revenue"
                >
                  {aggregations?.bySection?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Hospital Unit */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Hospital Unit</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregations?.byUnit?.slice(0, 10) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="hospital_unit" 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  stroke="#6b7280"
                />
                <YAxis 
                  tickFormatter={(value) => `UGX ${(value/1000).toFixed(0)}K`}
                  stroke="#6b7280"
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                />
                <Legend />
                <Bar dataKey="total_revenue" fill="#deab5f" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Tests by Revenue */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Tests by Revenue</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={aggregations?.byTest?.slice(0, 10) || []}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => `UGX ${(value/1000).toFixed(0)}K`}
                  stroke="#6b7280"
                />
                <YAxis 
                  type="category" 
                  dataKey="test_name"
                  width={150}
                  stroke="#6b7280"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                />
                <Legend />
                <Bar dataKey="total_revenue" fill="#4CAF50" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lab Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lab Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueData.slice(0, 10).map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(item.date, 'dd-MMM-yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.lab_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.test_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.lab_section}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.shift}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.hospital_unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                    {formatCurrency(item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {revenueData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No revenue data found for the selected filters
          </div>
        )}
      </div>
    </div>
  );
};

// Add missing icon imports
const CurrencyDollarIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Revenue;