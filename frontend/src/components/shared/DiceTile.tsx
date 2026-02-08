import React from 'react';
import { Link } from 'react-router-dom';

interface DiceTileProps {
  to: string;
  label: string;
  type?: 'chart' | 'table' | 'display';
}

const DiceTile: React.FC<DiceTileProps> = ({ to, label, type = 'table' }) => {
  return (
    <Link to={to} className="dice-tile" data-type={type}>
      <span className="dice-label">{label}</span>
    </Link>
  );
};

export default DiceTile;