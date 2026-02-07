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
    <nav className="bg-secondary border-b border-highlight/20">
      <div className="container mx-auto px-4">
        <div className="flex gap-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `px-6 py-3 font-medium transition-all ${
                isActive
                  ? 'bg-highlight text-white border-b-2 border-neon-blue'
                  : 'text-gray-300 hover:text-white hover:bg-accent'
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
                  ? 'bg-highlight text-white border-b-2 border-neon-blue'
                  : 'text-gray-300 hover:text-white hover:bg-accent'
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
                  ? 'bg-highlight text-white border-b-2 border-neon-blue'
                  : 'text-gray-300 hover:text-white hover:bg-accent'
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
                  ? 'bg-highlight text-white border-b-2 border-neon-blue'
                  : 'text-gray-300 hover:text-white hover:bg-accent'
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
                  ? 'bg-highlight text-white border-b-2 border-neon-blue'
                  : 'text-gray-300 hover:text-white hover:bg-accent'
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