// frontend/src/components/tables/PerformanceTable.tsx
import React from 'react';

export interface PerformanceRecord {
  id: number;
  date: string;
  shift: string;
  labNumber: string;
  unit: string;
  timeIn: string;
  dailyTAT: number;
  timeExpected: string;
  timeOut: string;
  delayStatus: 'on-time' | 'delayed' | 'over-delayed';
  timeRange: string;
}

interface PerformanceTableProps {
  data: PerformanceRecord[];
  isLoading?: boolean;
}

const PerformanceTable: React.FC<PerformanceTableProps> = ({ data, isLoading = false }) => {
  const getDelayStatusColor = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'bg-green-100 text-green-800';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800';
      case 'over-delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDelayStatusIcon = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'fas fa-check-circle text-green-500';
      case 'delayed':
        return 'fas fa-clock text-yellow-500';
      case 'over-delayed':
        return 'fas fa-exclamation-triangle text-red-500';
      default:
        return 'fas fa-question-circle text-gray-500';
    }
  };

  const getDelayStatusText = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'On Time';
      case 'delayed':
        return 'Delayed';
      case 'over-delayed':
        return 'Over Delayed';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="table-container">
        <table className="neon-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Shift</th>
              <th className="lab-number-cell">Lab Number</th>
              <th>Unit</th>
              <th>Time In</th>
              <th>Daily TAT <span className="subtext">(minutes)</span></th>
              <th>Time Expected</th>
              <th>Time Out</th>
              <th>Delay Status</th>
              <th>Time Range</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={11} className="text-center">
                <div className="loader-inline">
                  <div className="one"></div>
                  <div className="two"></div>
                  <div className="three"></div>
                  <div className="four"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <table className="neon-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Shift</th>
              <th className="lab-number-cell">Lab Number</th>
              <th>Unit</th>
              <th>Time In</th>
              <th>Daily TAT <span className="subtext">(minutes)</span></th>
              <th>Time Expected</th>
              <th>Time Out</th>
              <th>Delay Status</th>
              <th>Time Range</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={11} className="text-center">
                No data available
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="neon-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Shift</th>
            <th className="lab-number-cell">Lab Number</th>
            <th>Unit</th>
            <th>Time In</th>
            <th>Daily TAT <span className="subtext">(minutes)</span></th>
            <th>Time Expected</th>
            <th>Time Out</th>
            <th>Delay Status</th>
            <th>Time Range</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{new Date(row.date).toLocaleDateString()}</td>
              <td>{row.shift}</td>
              <td className="lab-number-cell">{row.labNumber}</td>
              <td>{row.unit}</td>
              <td>{row.timeIn}</td>
              <td>
                <span className={`px-2 py-1 rounded-full ${row.dailyTAT > 120 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {row.dailyTAT} min
                </span>
              </td>
              <td>{row.timeExpected}</td>
              <td>{row.timeOut || '-'}</td>
              <td>
                <div className="flex items-center space-x-2">
                  <i className={getDelayStatusIcon(row.delayStatus)}></i>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDelayStatusColor(row.delayStatus)}`}>
                    {getDelayStatusText(row.delayStatus)}
                  </span>
                </div>
              </td>
              <td>{row.timeRange}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PerformanceTable;