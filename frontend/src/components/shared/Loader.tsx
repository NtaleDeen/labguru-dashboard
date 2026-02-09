import React from 'react';

interface LoaderProps {
  isLoading: boolean;
}

const Loader: React.FC<LoaderProps> = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="loader">
      <div className="one"></div>
      <div className="two"></div>
      <div className="three"></div>
      <div className="four"></div>
    </div>
  );
};

export default Loader;