import React from 'react';

interface DiceTileProps {
  href: string;
  label: string;
  type?: 'chart' | 'table' | 'display' | 'admin';
}

const DiceTile: React.FC<DiceTileProps> = ({ href, label, type = 'table' }) => {
  return (
    <a href={href} className="dice-tile" data-type={type}>
      <span className="dice-label">{label}</span>
    </a>
  );
};

export default DiceTile;