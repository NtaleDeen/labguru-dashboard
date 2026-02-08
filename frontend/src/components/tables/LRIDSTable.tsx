import React, { useEffect, useState } from 'react';
import { LRIDSData } from '../../types';
import { getCurrentTime, getTodayDate } from '../../utils/dateUtils';

interface LRIDSTableProps {
  data: LRIDSData[];
}

const LRIDSTable: React.FC<LRIDSTableProps> = ({ data }) => {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [currentDate, setCurrentDate] = useState(getTodayDate());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
      setCurrentDate(getTodayDate());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getProgressColor = (progress: string) => {
    switch (progress) {
      case 'Ready':
        return 'text-success';
      case 'In Progress':
        return 'text-warning';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div>
      {/* Header with Date/Time - EXACT OLD DESIGN */}
      <div className="main-search-container">
        <div className="search-actions-row">
          <div className="current-date-time">
            <span id="currentDate" style={{ color: 'white', fontWeight: 'bold' }}>
              {currentDate}
            </span>
            <span id="currentTime" style={{ color: 'white', fontWeight: 'bold', marginLeft: '20px' }}>
              {currentTime}
            </span>
          </div>
        </div>
      </div>

      {/* Table - EXACT OLD DESIGN */}
      <div className="table-container">
        <table className="neon-table" id="lrids">
          <thead>
            <tr>
              <th className="lab-number-cell">Lab Number</th>
              <th>Time In</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody id="lridsBody">
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-gray-500 text-xl">
                  No tests for today
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={index} className="text-lg">
                  <td className="font-mono font-bold text-highlight lab-number-cell">
                    {item.labNo}
                  </td>
                  <td className="font-semibold">{item.timeIn}</td>
                  <td className={`font-bold ${getProgressColor(item.progress)}`}>
                    {item.progress}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LRIDSTable;