import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  title: string;
  showLogout?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showLogout = true }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-primary border-b border-highlight/30 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/images/logo-nakasero.png"
              alt="Nakasero Hospital"
              className="h-12"
            />
            <h1 className="text-xl md:text-2xl font-bold text-white neon-glow">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm text-gray-300">
                <span className="font-semibold text-highlight">{user.username}</span>
                <span className="ml-2 text-xs text-gray-400">({user.role})</span>
              </div>
            )}
            {showLogout && (
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;