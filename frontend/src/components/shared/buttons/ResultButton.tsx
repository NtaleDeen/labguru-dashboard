import React from 'react';

interface ResultButtonProps {
  hasResult: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ResultButton: React.FC<ResultButtonProps> = ({ hasResult, onClick, disabled = false }) => {
  return (
    <div className="button-container">
      <button
        className="result-btn"
        onClick={onClick}
        disabled={disabled || hasResult}
      >
        {hasResult ? 'Resulted' : 'Result'}
      </button>
    </div>
  );
};

export default ResultButton;