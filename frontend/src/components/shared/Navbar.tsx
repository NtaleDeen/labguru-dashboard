import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar: React.FC = () => {
  const { user } = useAuth();

  // Hide navbar for viewers and technicians
  if (user?.role === 'viewer' || user?.role === 'technician') {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex gap-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `px-6 py-3 font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/revenue"
            className={({ isActive }) =>
              `px-6 py-3 font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`
            }
          >
            Revenue
          </NavLink>
          <NavLink
            to="/tests"
            className={({ isActive }) =>
              `px-6 py-3 font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`
            }
          >
            Tests
          </NavLink>
          <NavLink
            to="/numbers"
            className={({ isActive }) =>
              `px-6 py-3 font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`
            }
          >
            Numbers
          </NavLink>
          <NavLink
            to="/tat"
            className={({ isActive }) =>
              `px-6 py-3 font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white border-b-2 border-primary'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
              }`
            }
          >
            TAT
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;