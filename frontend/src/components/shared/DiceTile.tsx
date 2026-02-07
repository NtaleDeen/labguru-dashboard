import React from 'react';
import { Link } from 'react-router-dom';

interface DiceTileProps {
  to: string;
  label: string;
  type?: 'chart' | 'table' | 'display';
}

const DiceTile: React.FC<DiceTileProps> = ({ to, label, type = 'chart' }) => {
  return (
    <Link to={to} className="dice-tile group">
      <div className="text-center">
        <div className="text-2xl font-bold mb-2 group-hover:text-neon-blue transition-colors">
          {label}
        </div>
        <div className="text-xs text-gray-400 uppercase tracking-wider">
          {type}
        </div>
      </div>
    </Link>
  );
};

export default DiceTile;