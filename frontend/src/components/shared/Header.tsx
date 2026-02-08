// components/shared/Header.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  title: string;
  showNavbar?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showNavbar = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  return (
    <header>
      <div className="header-container">
        <div className="header-left">
          <div className="logo">
            <img src="/images/logo-nakasero.png" alt="logo" />
          </div>
          <h1>{title}</h1>
        </div>
        <div className="page">
          <span>{title.split(' ')[0]}</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
          <span className="three-dots-menu-container">
            <button className="three-dots-button" onClick={toggleDropdown}>
              &#x22EE;
            </button>
            <ul className={`dropdown-menu ${dropdownVisible ? 'visible' : ''}`}>
              <li><a href="/dashboard">Dashboard</a></li>
              <li><a href="/reception">Reception Table</a></li>
              <li><a href="/progress">Progress Table</a></li>
              <li><a href="/performance">Performance Table</a></li>
              {user?.role === 'admin' && <li><a href="/admin">Admin Panel</a></li>}
            </ul>
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;