// PerformanceTable.tsx
import React from 'react';
import { formatDateTime } from '../../utils/dateUtils';

interface PerformanceRecord {
  id: number;
  encounter_date: string;
  lab_no: string;
  shift: string;
  laboratory: string;
  lab_section_at_test: string;
  test_name: string;
  time_in: string;
  time_out?: string;
  actual_tat?: number;
  tat_at_test: number;
  delay_status: 'on-time' | 'delayed-less-15' | 'over-delayed';
  time_range: string;
}

interface PerformanceTableProps {
  data: PerformanceRecord[];
}

const PerformanceTable: React.FC<PerformanceTableProps> = ({ data }) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'status-on-time';
      case 'delayed-less-15':
        return 'status-delayed-less-15';
      case 'over-delayed':
        return 'status-over-delayed';
      default:
        return '';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on-time':
        return 'On Time';
      case 'delayed-less-15':
        return '<15 min delayed';
      case 'over-delayed':
        return 'Over Delayed';
      default:
        return status;
    }
  };

  return (
    <div className="table-container">
      <table className="neon-table" id="performance">
        <thead>
          <tr>
            <th>Date</th>
            <th>Shift</th>
            <th className="lab-number-cell">Lab Number</th>
            <th>Unit</th>
            <th>Lab Section</th>
            <th>Test Name</th>
            <th>Time In</th>
            <th>Time Out</th>
            <th>TAT <span className="subtext">(minutes)</span></th>
            <th>Delay Status</th>
            <th>Time Range</th>
          </tr>
        </thead>
        <tbody id="performanceBody">
          {data.length === 0 ? (
            <tr>
              <td colSpan={11} className="text-center py-8 text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            data.map((record) => (
              <tr key={record.id}>
                <td>
                  {new Date(record.encounter_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </td>
                <td>{record.shift}</td>
                <td className="font-mono font-semibold lab-number-cell">
                  {record.lab_no}
                </td>
                <td>{record.laboratory}</td>
                <td>{record.lab_section_at_test}</td>
                <td>{record.test_name}</td>
                <td>{formatDateTime(record.time_in)}</td>
                <td>
                  {record.time_out
                    ? formatDateTime(record.time_out)
                    : 'N/A'}
                </td>
                <td>{record.actual_tat || record.tat_at_test}</td>
                <td className={getStatusClass(record.delay_status)}>
                  {getStatusText(record.delay_status)}
                </td>
                <td className={getStatusClass(record.delay_status)}>
                  {record.time_range}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PerformanceTable;