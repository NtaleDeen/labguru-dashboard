// components/shared/buttons/UrgentButton.tsx
import React from 'react';

interface UrgentButtonProps {
  isUrgent: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const UrgentButton: React.FC<UrgentButtonProps> = ({ isUrgent, onClick, disabled = false }) => {
  return (
    <button
      className={`urgent-btn ${isUrgent ? 'urgent' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {isUrgent ? 'Urgent' : 'Mark Urgent'}
    </button>
  );
};

export default UrgentButton;