import React from 'react';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
  type?: 'table' | 'chart';
}

const Navbar: React.FC<NavbarProps> = ({ type = 'table' }) => {
  const location = useLocation();
  
  const tableLinks = [
    { path: '/dashboard', label: 'Home' },
    { path: '/reception', label: 'Reception' },
    { path: '/meta', label: 'Meta' },
    { path: '/progress', label: 'Progress' },
    { path: '/performance', label: 'Performance' },
    { path: '/tracker', label: 'Tracker' },
    { path: '/lrids', label: 'LRIDS' },
  ];

  const chartLinks = [
    { path: '/dashboard', label: 'Home' },
    { path: '/revenue', label: 'Revenue' },
    { path: '/tests', label: 'Tests' },
    { path: '/numbers', label: 'Numbers' },
    { path: '/tat', label: 'TAT' },
  ];

  const links = type === 'chart' ? chartLinks : tableLinks;
  const navbarClass = type === 'chart' ? 'navbar chart-navbar' : 'navbar';

  return (
    <nav className={navbarClass}>
      {links.map((link) => (
        <a
          key={link.path}
          href={link.path}
          className={location.pathname === link.path ? 'active' : ''}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};

export default Navbar;