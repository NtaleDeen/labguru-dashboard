// components/shared/buttons/ReceiveButton.tsx
import React from 'react';

interface ReceiveButtonProps {
  isReceived: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const ReceiveButton: React.FC<ReceiveButtonProps> = ({ isReceived, onClick, disabled = false }) => {
  return (
    <button
      className="receive-btn"
      onClick={onClick}
      disabled={disabled || isReceived}
    >
      {isReceived ? 'Received' : 'Receive'}
    </button>
  );
};

export default ReceiveButton;