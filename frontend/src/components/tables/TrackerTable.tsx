import React, { useState } from 'react';
import { formatDateTime } from '../../utils/dateUtils';
import Modal from '../shared/Modal';

interface TrackerRecord {
  id: number;
  encounter_date: string;
  lab_no: string;
  test_name: string;
  shift: string;
  laboratory: string;
  lab_section_at_test: string;
  is_urgent: boolean;
  is_received: boolean;
  time_in: string;
  time_out?: string;
  actual_tat?: number;
  tat_at_test: number;
  time_expected: string;
}

interface TrackerTableProps {
  data: TrackerRecord[];
}

const TrackerTable: React.FC<TrackerTableProps> = ({ data }) => {
  const [selectedLabNo, setSelectedLabNo] = useState<string | null>(null);
  const [testsForLabNo, setTestsForLabNo] = useState<TrackerRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Deduplicate by lab number for display
  const deduplicatedData = React.useMemo(() => {
    const labNoMap = new Map<string, TrackerRecord>();
    
    data.forEach(record => {
      if (!labNoMap.has(record.lab_no)) {
        labNoMap.set(record.lab_no, record);
      }
    });
    
    return Array.from(labNoMap.values());
  }, [data]);

  const handleLabNoClick = (labNo: string) => {
    const tests = data.filter(record => record.lab_no === labNo);
    setTestsForLabNo(tests);
    setSelectedLabNo(labNo);
    setModalOpen(true);
  };

  const calculateProgress = (timeExpected: string, timeOut?: string) => {
    const now = new Date();
    const expectedTime = new Date(timeExpected);
    
    if (timeOut) {
      const completedTime = new Date(timeOut);
      if (completedTime <= now) {
        return { text: 'Completed', class: 'progress-complete-actual' };
      }
    }
    
    if (expectedTime <= now && !timeOut) {
      return { text: 'Delayed', class: 'progress-overdue' };
    }
    
    const timeLeft = expectedTime.getTime() - now.getTime();
    const minutesLeft = Math.floor(timeLeft / (1000 * 60));
    
    if (minutesLeft <= 10 && minutesLeft > 0) {
      return { text: `${minutesLeft} min(s) remaining`, class: 'progress-urgent' };
    } else if (minutesLeft > 0) {
      const hoursLeft = Math.floor(minutesLeft / 60);
      const daysLeft = Math.floor(hoursLeft / 24);
      
      if (daysLeft > 0) {
        return { text: `${daysLeft} day(s) remaining`, class: 'progress-pending' };
      } else if (hoursLeft > 0) {
        return { text: `${hoursLeft} hr(s) remaining`, class: 'progress-pending' };
      } else {
        return { text: `${minutesLeft} min(s) remaining`, class: 'progress-pending' };
      }
    }
    
    return { text: 'No ETA', class: 'progress-pending' };
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="neon-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Shift</th>
              <th>Lab Number</th>
              <th>Unit</th>
              <th>Lab Section</th>
              <th>Time In</th>
              <th>Urgency</th>
              <th>Time Received</th>
              <th>TAT (minutes)</th>
              <th>Time Expected</th>
              <th>Progress</th>
              <th>Time Out</th>
            </tr>
          </thead>
          <tbody>
            {deduplicatedData.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-8 text-gray-400">
                  No data available
                </td>
              </tr>
            ) : (
              deduplicatedData.map((record) => {
                const progress = calculateProgress(record.time_expected, record.time_out);
                const hasMultipleTests = data.filter(r => r.lab_no === record.lab_no).length > 1;
                
                return (
                  <tr key={record.id}>
                    <td>{new Date(record.encounter_date).toLocaleDateString()}</td>
                    <td>{record.shift}</td>
                    <td 
                      className={hasMultipleTests ? "lab-number-cell" : ""}
                      onClick={() => hasMultipleTests && handleLabNoClick(record.lab_no)}
                    >
                      {record.lab_no}
                      {hasMultipleTests && <span className="ml-1 text-xs text-primary">({data.filter(r => r.lab_no === record.lab_no).length})</span>}
                    </td>
                    <td>{record.laboratory}</td>
                    <td>{record.lab_section_at_test}</td>
                    <td>{formatDateTime(record.time_in)}</td>
                    <td>{record.is_urgent ? <span className="text-danger font-bold">URGENT</span> : 'Normal'}</td>
                    <td>{record.is_received ? formatDateTime(record.time_in) : 'N/A'}</td>
                    <td>{record.tat_at_test}</td>
                    <td>{formatDateTime(record.time_expected)}</td>
                    <td className={progress.class}>{progress.text}</td>
                    <td>{record.time_out ? formatDateTime(record.time_out) : 'N/A'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for showing all tests for a lab number */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`All Tests for Lab Number: ${selectedLabNo}`}
        maxWidth="max-w-6xl"
      >
        <div className="overflow-x-auto">
          <table className="neon-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Lab Section</th>
                <th>Progress</th>
                <th>Time Out</th>
              </tr>
            </thead>
            <tbody>
              {testsForLabNo.map((test) => {
                const progress = calculateProgress(test.time_expected, test.time_out);
                return (
                  <tr key={test.id}>
                    <td>{test.test_name}</td>
                    <td>{test.lab_section_at_test}</td>
                    <td className={progress.class}>{progress.text}</td>
                    <td>{test.time_out ? formatDateTime(test.time_out) : 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
};

export default TrackerTable;