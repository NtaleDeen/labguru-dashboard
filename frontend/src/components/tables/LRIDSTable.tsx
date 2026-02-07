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
      {/* Header with Date/Time */}
      <div className="bg-secondary p-4 rounded-lg mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-highlight neon-glow">
          Laboratory Report Information Display System
        </h2>
        <div className="text-right">
          <div className="text-xl font-bold text-white">{currentDate}</div>
          <div className="text-3xl font-bold text-neon-blue neon-glow">
            {currentTime}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="neon-table">
          <thead>
            <tr>
              <th className="text-left text-2xl">Lab Number</th>
              <th className="text-left text-2xl">Time In</th>
              <th className="text-left text-2xl">Progress</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-12 text-gray-400 text-xl">
                  No tests for today
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={index} className="text-xl">
                  <td className="font-mono font-bold text-highlight">
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