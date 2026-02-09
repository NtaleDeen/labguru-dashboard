import React from 'react';

interface HeaderProps {
  title: string;
  pageTitle: string;
  onLogout?: () => void;
  onResetFilters?: () => void;
  showResetFilters?: boolean;
  menuItems?: Array<{
    label: string;
    href: string;
    icon?: string;
  }>;
}

const Header: React.FC<HeaderProps> = ({
  title,
  pageTitle,
  onLogout,
  onResetFilters,
  showResetFilters = false,
  menuItems = []
}) => {
  const defaultMenuItems = [
    { label: 'Admin Panel', href: '/admin', icon: 'fas fa-cog' },
    { label: 'Dashboard', href: '/dashboard', icon: 'fas fa-home' },
  ];

  const allMenuItems = [...defaultMenuItems, ...menuItems];

  return (
    <header>
      <div className="header-container">
        <div className="header-left">
          <div className="logo">
            <img src="/images/logo-nakasero.png" alt="logo" />
          </div>
          <h1>{title}</h1>
        </div>
        <div className="page page-table">
          <span>{pageTitle}</span>
          {onLogout && (
            <a 
              href="#" 
              className="logout-button" 
              onClick={(e) => {
                e.preventDefault();
                onLogout();
              }}
            >
              Logout
            </a>
          )}
          {showResetFilters && onResetFilters && (
            <a 
              href="#" 
              className="logout-button"
              onClick={(e) => {
                e.preventDefault();
                onResetFilters();
              }}
            >
              Reset Filters
            </a>
          )}
          <span className="three-dots-menu-container">
            <button className="three-dots-button">&#x22EE;</button>
            <ul className="dropdown-menu">
              {allMenuItems.map((item, index) => (
                <li key={index}>
                  <a href={item.href}>
                    {item.icon && <i className={item.icon}></i>} {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;