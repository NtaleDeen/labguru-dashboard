import React, { useState } from 'react';
import { TestRecord } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import Modal from '../shared/Modal';
import { useAuth } from '../../hooks/useAuth';

interface ReceptionTableProps {
  data: TestRecord[];
  onUpdateStatus: (id: number, updates: any) => void;
  onCancelTest: (id: number, reason: string) => void;
  onBulkUpdate?: (ids: number[], action: string) => void;
}

const ReceptionTable: React.FC<ReceptionTableProps> = ({
  data,
  onUpdateStatus,
  onCancelTest,
  onBulkUpdate,
}) => {
  const { user } = useAuth();
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTestId, setCancelTestId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTests(data.map((test) => test.id));
    } else {
      setSelectedTests([]);
    }
  };

  const handleSelectTest = (id: number) => {
    setSelectedTests((prev) =>
      prev.includes(id) ? prev.filter((testId) => testId !== id) : [...prev, id]
    );
  };

  const handleBulkAction = (action: string) => {
    if (onBulkUpdate && selectedTests.length > 0) {
      onBulkUpdate(selectedTests, action);
      setSelectedTests([]);
    }
  };

  const openCancelModal = (id: number) => {
    setCancelTestId(id);
    setCancelModalOpen(true);
  };

  const handleCancelSubmit = () => {
    if (cancelTestId && cancelReason.trim()) {
      onCancelTest(cancelTestId, cancelReason);
      setCancelModalOpen(false);
      setCancelTestId(null);
      setCancelReason('');
    }
  };

  // Only show bulk actions for admin/manager
  const showBulkActions = (user?.role === 'admin' || user?.role === 'manager') && selectedTests.length > 0;

  return (
    <div>
      {/* Bulk Actions Row - EXACT OLD DESIGN */}
      {showBulkActions && (
        <div id="multi-select-actions" className="multi-select-container">
          <button
            id="multi-urgent-btn"
            className="urgent-btn"
            onClick={() => handleBulkAction('urgent')}
          >
            Mark as Urgent ({selectedTests.length})
          </button>
          <button
            id="multi-receive-btn"
            className="receive-btn"
            onClick={() => handleBulkAction('receive')}
          >
            Receive Selected ({selectedTests.length})
          </button>
          <button
            id="multi-result-btn"
            className="result-btn"
            onClick={() => handleBulkAction('result')}
          >
            Result Selected ({selectedTests.length})
          </button>
        </div>
      )}

      {/* Table - EXACT OLD DESIGN */}
      <div className="table-container">
        <table className="neon-table" id="reception">
          <thead>
            <tr>
              <th className="py-2 px-4">
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectedTests.length === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
              </th>
              <th>Date</th>
              <th className="lab-number-cell">Lab Number</th>
              <th>Shift</th>
              <th>Unit</th>
              <th>Lab Section</th>
              <th>Test Name</th>
              <th className="text-center">Urgency</th>
              <th className="text-center">Receive</th>
              <th className="text-center">Result</th>
              {user?.role !== 'viewer' && <th className="text-center">Actions</th>}
            </tr>
          </thead>
          <tbody id="receptionBody">
            {data.length === 0 ? (
              <tr>
                <td colSpan={user?.role !== 'viewer' ? 11 : 10} className="text-center py-4 text-gray-500">
                  Loading data...
                </td>
              </tr>
            ) : (
              data.map((test) => (
                <tr
                  key={test.id}
                  className={test.is_cancelled ? 'opacity-50 line-through' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(test.id)}
                      onChange={() => handleSelectTest(test.id)}
                      disabled={test.is_cancelled}
                    />
                  </td>
                  <td>{formatDate(test.encounter_date)}</td>
                  <td className="font-mono font-semibold lab-number-cell">
                    {test.lab_no}
                  </td>
                  <td>{test.shift}</td>
                  <td>{test.laboratory}</td>
                  <td>{test.lab_section_at_test}</td>
                  <td>{test.test_name}</td>
                  <td className="text-center">
                    <button
                      className={`urgent-btn ${test.is_urgent ? 'urgent' : ''}`}
                      onClick={() => onUpdateStatus(test.id, { isUrgent: !test.is_urgent })}
                      disabled={test.is_cancelled || user?.role === 'viewer'}
                    >
                      {test.is_urgent ? 'Urgent' : 'Normal'}
                    </button>
                  </td>
                  <td className="text-center">
                    <button
                      className="receive-btn"
                      onClick={() => onUpdateStatus(test.id, { isReceived: !test.is_received })}
                      disabled={test.is_cancelled || user?.role === 'viewer'}
                    >
                      {test.is_received ? 'Received' : 'Receive'}
                    </button>
                  </td>
                  <td className="text-center">
                    <button
                      className="result-btn"
                      onClick={() => onUpdateStatus(test.id, { isResulted: !test.is_resulted })}
                      disabled={test.is_cancelled || user?.role === 'viewer'}
                    >
                      {test.is_resulted ? 'Resulted' : 'Result'}
                    </button>
                  </td>
                  {user?.role !== 'viewer' && (
                    <td className="text-center">
                      {!test.is_cancelled ? (
                        <button
                          onClick={() => openCancelModal(test.id)}
                          className="bg-danger text-white px-3 py-1 rounded text-sm hover:opacity-80"
                          disabled={user?.role === 'technician'}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-danger text-sm">Cancelled</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setCancelReason('');
        }}
        title="Cancel Test"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Reason for Cancellation
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full h-32 p-2 border border-gray-300 rounded"
              placeholder="Enter reason for cancellation..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setCancelModalOpen(false);
                setCancelReason('');
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleCancelSubmit}
              className="bg-danger text-white px-6 py-2 rounded-md hover:opacity-80"
              disabled={!cancelReason.trim()}
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReceptionTable;