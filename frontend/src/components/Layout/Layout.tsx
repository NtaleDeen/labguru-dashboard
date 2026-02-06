import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authcontext';
import toast from 'react-hot-toast';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊', roles: ['manager', 'technician', 'viewer'] },
    { name: 'Meta Table', path: '/meta', icon: '🧪', roles: ['manager', 'technician', 'viewer'] },
    { name: 'User Management', path: '/admin/users', icon: '👥', roles: ['manager'] },
  ];

  const filteredNav = navigation.filter((item) =>
    user && item.roles.includes(user.role)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="bg-primary text-white shadow-lg fixed top-0 left-0 right-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:text-accent transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">LRIDS</h1>
            <span className="text-sm text-gray-300 hidden md:inline">Laboratory Report Information Display System</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-gray-300 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-accent hover:bg-accentDark rounded-lg font-semibold transition text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 bg-white shadow-lg transition-transform duration-300 z-20 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '250px' }}
      >
        <nav className="p-4 space-y-2">
          {filteredNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isActive(item.path)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 pt-16 ${
          sidebarOpen ? 'ml-[250px]' : 'ml-0'
        }`}
      >
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;