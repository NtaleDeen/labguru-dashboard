import React, { useState } from 'react';
import { formatDateTime, formatTime } from '../../utils/dateUtils';
import Modal from '../shared/Modal';

interface ProgressRecord {
  id: number;
  encounter_date: string;
  lab_no: string;
  test_name: string;
  shift: string;
  laboratory: string;
  lab_section_at_test: string;
  time_in: string;
  tat_at_test: number;
  time_expected: string;
  time_out?: string;
}

interface ProgressTableProps {
  data: ProgressRecord[];
}

const ProgressTable: React.FC<ProgressTableProps> = ({ data }) => {
  const [selectedLabNo, setSelectedLabNo] = useState<string | null>(null);
  const [testsForLabNo, setTestsForLabNo] = useState<ProgressRecord[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Deduplicate by lab number
  const deduplicatedData = React.useMemo(() => {
    const labNoMap = new Map<string, ProgressRecord>();
    
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
        return { text: 'Ready', class: 'progress-complete-actual' };
      }
    }
    
    if (expectedTime <= now && !timeOut) {
      return { text: 'Delayed', class: 'progress-overdue' };
    }
    
    const timeLeft = expectedTime.getTime() - now.getTime();
    const minutesLeft = Math.floor(timeLeft / (1000 * 60));
    
    if (minutesLeft <= 10 && minutesLeft > 0) {
      return { text: 'In Progress', class: 'progress-urgent' };
    } else if (minutesLeft > 0) {
      return { text: 'Pending', class: 'progress-pending' };
    }
    
    return { text: 'Pending', class: 'progress-pending' };
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
              <th>Time In</th>
              <th>Daily TAT (minutes)</th>
              <th>Time Expected</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {deduplicatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">
                  No tests for today
                </td>
              </tr>
            ) : (
              deduplicatedData.map((record) => {
                const progress = calculateProgress(record.time_expected, record.time_out);
                const hasMultipleTests = data.filter(r => r.lab_no === record.lab_no).length > 1;
                
                return (
                  <tr key={record.id}>
                    <td>{new Date(record.encounter_date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</td>
                    <td>{record.shift}</td>
                    <td 
                      className={hasMultipleTests ? "lab-number-cell" : ""}
                      onClick={() => hasMultipleTests && handleLabNoClick(record.lab_no)}
                    >
                      {record.lab_no}
                      {hasMultipleTests && <span className="ml-1 text-xs text-primary">({data.filter(r => r.lab_no === record.lab_no).length})</span>}
                    </td>
                    <td>{record.laboratory}</td>
                    <td>{formatDateTime(record.time_in)}</td>
                    <td>{record.tat_at_test}</td>
                    <td>{formatDateTime(record.time_expected)}</td>
                    <td className={progress.class}>{progress.text}</td>
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
        maxWidth="max-w-4xl"
      >
        <div className="overflow-x-auto">
          <table className="neon-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Lab Section</th>
                <th>TAT</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {testsForLabNo.map((test) => {
                const progress = calculateProgress(test.time_expected, test.time_out);
                return (
                  <tr key={test.id}>
                    <td>{test.test_name}</td>
                    <td>{test.lab_section_at_test}</td>
                    <td>{test.tat_at_test} min</td>
                    <td className={progress.class}>{progress.text}</td>
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

export default ProgressTable;