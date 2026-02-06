import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '../utils/auth';
import { api } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';
import {
  ChartBarIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
  CalculatorIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface DashboardTile {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  accessRequired: string[];
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [unmatchedTests, setUnmatchedTests] = useState<any[]>([]);

  useEffect(() => {
    const userData = AuthService.getUser();
    setUser(userData);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, activityRes, unmatchedRes] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardActivity(),
        api.getUnmatchedTests(),
      ]);

      setStats(statsRes.data);
      setActivity(activityRes.data);
      setUnmatchedTests(unmatchedRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const dashboardTiles: DashboardTile[] = [
    {
      id: 'revenue',
      title: 'Revenue',
      description: 'Financial analytics and reports',
      icon: CurrencyDollarIcon,
      href: '/revenue',
      color: 'bg-blue-500 hover:bg-blue-600',
      accessRequired: ['admin', 'manager'],
    },
    {
      id: 'reception',
      title: 'Reception',
      description: 'Test registration and tracking',
      icon: TableCellsIcon,
      href: '/reception',
      color: 'bg-green-500 hover:bg-green-600',
      accessRequired: ['admin', 'manager', 'technician'],
    },
    {
      id: 'lrids',
      title: 'LRIDS',
      description: 'Live progress display',
      icon: PresentationChartLineIcon,
      href: '/lrids',
      color: 'bg-purple-500 hover:bg-purple-600',
      accessRequired: ['admin', 'manager', 'technician', 'viewer'],
    },
    {
      id: 'meta',
      title: 'Meta Data',
      description: 'Test metadata management',
      icon: DocumentChartBarIcon,
      href: '/meta',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      accessRequired: ['admin', 'manager', 'technician'],
    },
    {
      id: 'admin',
      title: 'Admin Panel',
      description: 'User and system management',
      icon: UserGroupIcon,
      href: '/admin',
      color: 'bg-red-500 hover:bg-red-600',
      accessRequired: ['admin'],
    },
    {
      id: 'tests',
      title: 'Tests',
      description: 'Test volume analytics',
      icon: CalculatorIcon,
      href: '/tests',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      accessRequired: ['admin', 'manager'],
    },
    {
      id: 'tat',
      title: 'TAT',
      description: 'Turnaround time analysis',
      icon: ClockIcon,
      href: '/tat',
      color: 'bg-pink-500 hover:bg-pink-600',
      accessRequired: ['admin', 'manager'],
    },
    {
      id: 'performance',
      title: 'Performance',
      description: 'Staff and system performance',
      icon: ChartBarIcon,
      href: '/performance',
      color: 'bg-teal-500 hover:bg-teal-600',
      accessRequired: ['admin', 'manager'],
    },
  ];

  const visibleTiles = dashboardTiles.filter(tile => 
    tile.accessRequired.some(role => AuthService.hasRole([role]))
  );

  const handleCopyTestName = (testName: string) => {
    navigator.clipboard.writeText(testName);
    toast.success('Test name copied to clipboard');
  };

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.username}!
            </h1>
            <p className="mt-1 text-gray-600">
              Here's what's happening with your laboratory today.
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            user?.role === 'admin' ? 'bg-purple-100 text-purple-800' :
            user?.role === 'manager' ? 'bg-blue-100 text-blue-800' :
            user?.role === 'technician' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {user?.role}
          </div>
        </div>
      </div>

      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.today.revenue)}
                </p>
                <p className="text-sm text-gray-500">{stats.today.tests} tests</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Tests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.today.pending}</p>
                <p className="text-sm text-gray-500">To be completed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue Tests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.today.overdue}</p>
                <p className="text-sm text-gray-500">Need attention</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentChartBarIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unmatched Tests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.alerts.unmatchedTests}</p>
                <p className="text-sm text-gray-500">Require mapping</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main dashboard tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleTiles.map((tile) => (
          <Link
            key={tile.id}
            to={tile.href}
            className={`${tile.color} rounded-xl shadow-card transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
          >
            <div className="p-6 text-white">
              <div className="flex items-center justify-between">
                <tile.icon className="h-10 w-10" />
                <ArrowTrendingUpIcon className="h-6 w-6 opacity-75" />
              </div>
              <h3 className="mt-4 text-xl font-bold">{tile.title}</h3>
              <p className="mt-2 opacity-90">{tile.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent activity and unmatched tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="bg-white rounded-xl shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            {activity.length > 0 ? (
              <div className="space-y-4">
                {activity.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(item.date)}</p>
                      <p className="text-sm text-gray-600">{item.count} tests processed</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(item.amount)}</p>
                      <p className="text-sm text-gray-600">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Unmatched tests alert */}
        {unmatchedTests.length > 0 && AuthService.hasRole(['admin', 'manager']) && (
          <div className="bg-white rounded-xl shadow-card">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Unmatched Tests</h2>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {unmatchedTests.length} pending
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                These test names were found in data but don't exist in metadata
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {unmatchedTests.slice(0, 5).map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{test.test_name}</p>
                      <p className="text-sm text-gray-600">
                        Seen {test.occurrences} times, last on {formatDate(test.last_seen, 'dd-MMM')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopyTestName(test.test_name)}
                      className="ml-4 px-3 py-1 text-sm bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
              {unmatchedTests.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    to="/meta"
                    className="text-primary hover:text-primary-light font-medium text-sm"
                  >
                    View all {unmatchedTests.length} unmatched tests →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions for admin */}
      {AuthService.hasRole(['admin']) && (
        <div className="bg-white rounded-xl shadow-card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/admin?tab=users"
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 text-center transition-colors"
              >
                <UserGroupIcon className="h-8 w-8 text-gray-600 mx-auto" />
                <p className="mt-2 font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-600">Add or edit users</p>
              </Link>
              
              <Link
                to="/meta"
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 text-center transition-colors"
              >
                <DocumentChartBarIcon className="h-8 w-8 text-gray-600 mx-auto" />
                <p className="mt-2 font-medium text-gray-900">Update Metadata</p>
                <p className="text-sm text-gray-600">Add new tests</p>
              </Link>
              
              <button
                onClick={() => api.exportMetadata()}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 text-center transition-colors"
              >
                <ArrowTrendingUpIcon className="h-8 w-8 text-gray-600 mx-auto" />
                <p className="mt-2 font-medium text-gray-900">Export Data</p>
                <p className="text-sm text-gray-600">Download CSV reports</p>
              </button>
              
              <Link
                to="/admin?tab=settings"
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 text-center transition-colors"
              >
                <Cog6ToothIcon className="h-8 w-8 text-gray-600 mx-auto" />
                <p className="mt-2 font-medium text-gray-900">System Settings</p>
                <p className="text-sm text-gray-600">Configure targets</p>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;