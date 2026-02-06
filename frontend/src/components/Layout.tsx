import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthService } from '../utils/auth';
import { api } from '../utils/api';
import { toast } from 'react-hot-toast';
import {
  ChartBarIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
  CalculatorIcon,
  ClockIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = AuthService.getUser();
    setUser(userData);
    
    // Load dashboard stats
    loadDashboardStats();
    
    // Update stats every 30 seconds
    const interval = setInterval(loadDashboardStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardStats = async () => {
    try {
      const stats = await api.getDashboardStats();
      setDashboardStats(stats.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      AuthService.logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const canAccess = (page: string) => {
    return AuthService.canAccess(page);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'technician':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, show: true },
    { name: 'Revenue', href: '/revenue', icon: ChartBarIcon, show: canAccess('revenue') },
    { name: 'Reception', href: '/reception', icon: TableCellsIcon, show: canAccess('reception') },
    { name: 'LRIDS', href: '/lrids', icon: PresentationChartLineIcon, show: canAccess('lrids') },
    { name: 'Meta Data', href: '/meta', icon: TableCellsIcon, show: canAccess('meta') },
    { name: 'Admin Panel', href: '/admin', icon: Cog6ToothIcon, show: canAccess('admin') },
  ].filter(item => item.show);

  const secondaryNavigation = [
    { name: 'Tests', href: '/tests', icon: CalculatorIcon, show: canAccess('tests') },
    { name: 'Numbers', href: '/numbers', icon: CalculatorIcon, show: canAccess('numbers') },
    { name: 'TAT', href: '/tat', icon: ClockIcon, show: canAccess('tat') },
    { name: 'Progress', href: '/progress', icon: ChartBarIcon, show: canAccess('progress') },
    { name: 'Performance', href: '/performance', icon: UserGroupIcon, show: canAccess('performance') },
    { name: 'Tracker', href: '/tracker', icon: ClockIcon, show: canAccess('tracker') },
  ].filter(item => item.show);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <img src="/images/logo-nakasero.png" alt="Logo" className="h-8" />
              <span className="text-lg font-semibold text-primary">Zyntel Dashboard</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === item.href
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
            
            {secondaryNavigation.length > 0 && (
              <>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    More Pages
                  </h3>
                </div>
                {secondaryNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                      location.pathname === item.href
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>
          
          {user && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user.username}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeftOnRectangleIcon className="mr-2 h-5 w-5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r border-gray-200">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
            <div className="flex items-center space-x-3">
              <img src="/images/logo-nakasero.png" alt="Logo" className="h-8" />
              <span className="text-lg font-semibold text-primary">Zyntel Dashboard</span>
            </div>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === item.href
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
            
            {secondaryNavigation.length > 0 && (
              <>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    More Pages
                  </h3>
                </div>
                {secondaryNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                      location.pathname === item.href
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>
          
          {user && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user.username}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeftOnRectangleIcon className="mr-2 h-5 w-5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 flex-shrink-0 bg-white border-b border-gray-200 lg:hidden">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {navigation.find(nav => nav.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            {user && (
              <div className="ml-4 flex items-center">
                <span className={`text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard stats bar */}
        {dashboardStats && location.pathname === '/dashboard' && (
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 py-3 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Today's Revenue</p>
                  <p className="text-2xl font-bold text-blue-900">
                    UGX {dashboardStats.today.revenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-700">{dashboardStats.today.tests} tests</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Pending Tests</p>
                  <p className="text-2xl font-bold text-green-900">{dashboardStats.today.pending}</p>
                  <p className="text-sm text-green-700">To be completed</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">Overdue Tests</p>
                  <p className="text-2xl font-bold text-yellow-900">{dashboardStats.today.overdue}</p>
                  <p className="text-sm text-yellow-700">Need attention</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Unmatched Tests</p>
                  <p className="text-2xl font-bold text-red-900">{dashboardStats.alerts.unmatchedTests}</p>
                  <p className="text-sm text-red-700">Require mapping</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;