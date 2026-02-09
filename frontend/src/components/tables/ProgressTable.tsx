// frontend/src/components/tables/ProgressTable.tsx
import React from 'react';

export interface ProgressRecord {
  id: number;
  date: string;
  shift: string;
  labNumber: string;
  unit: string;
  timeIn: string;
  dailyTAT: number;
  timeExpected: string;
  progress: 'pending' | 'in-progress' | 'completed';
  progressPercentage?: number;
}

interface ProgressTableProps {
  data: ProgressRecord[];
  isLoading?: boolean;
}

const ProgressTable: React.FC<ProgressTableProps> = ({ data, isLoading = false }) => {
  const getProgressColor = (progress: string) => {
    switch (progress) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressIcon = (progress: string) => {
    switch (progress) {
      case 'completed':
        return 'fas fa-check-circle text-green-500';
      case 'in-progress':
        return 'fas fa-spinner text-yellow-500 fa-spin';
      default:
        return 'fas fa-clock text-gray-500';
    }
  };

  const getProgressBar = (percentage?: number) => {
    const percent = percentage || 0;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full"
          style={{ width: `${percent}%` }}
        ></div>
        <span className="text-xs text-gray-600 ml-2">{percent}%</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="table-container">
        <table className="neon-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Shift</th>
              <th className="lab-number-cell">Lab Number</th>
              <th>Unit</th>
              <th>Time In</th>
              <th>Daily TAT <span className="subtext">(minutes)</span></th>
              <th>Time Expected</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="text-center">
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
              <th>Date</th>
              <th>Shift</th>
              <th className="lab-number-cell">Lab Number</th>
              <th>Unit</th>
              <th>Time In</th>
              <th>Daily TAT <span className="subtext">(minutes)</span></th>
              <th>Time Expected</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="text-center">
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
            <th>Date</th>
            <th>Shift</th>
            <th className="lab-number-cell">Lab Number</th>
            <th>Unit</th>
            <th>Time In</th>
            <th>Daily TAT <span className="subtext">(minutes)</span></th>
            <th>Time Expected</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
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
              <td>
                <div className="flex items-center space-x-2">
                  <i className={getProgressIcon(row.progress)}></i>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(row.progress)}`}>
                    {row.progress.charAt(0).toUpperCase() + row.progress.slice(1)}
                  </span>
                  {row.progress === 'in-progress' && getProgressBar(row.progressPercentage)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProgressTable;