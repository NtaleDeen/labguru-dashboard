import React, { useState } from 'react';
import { TestRecord } from '../../types';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Modal from '../shared/Modal';

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
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTestId, setCancelTestId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredData = data.filter(
    (test) =>
      test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.lab_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Search and Bulk Actions */}
      <div className="mb-4 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search test / lab number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        {selectedTests.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('urgent')}
              className="bg-danger text-white px-4 py-2 rounded-md hover:opacity-80 transition-opacity"
            >
              Mark as Urgent ({selectedTests.length})
            </button>
            <button
              onClick={() => handleBulkAction('receive')}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:opacity-80 transition-opacity"
            >
              Receive Selected ({selectedTests.length})
            </button>
            <button
              onClick={() => handleBulkAction('result')}
              className="bg-success text-white px-4 py-2 rounded-md hover:opacity-80 transition-opacity"
            >
              Result Selected ({selectedTests.length})
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="neon-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedTests.length === data.length && data.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Date</th>
              <th>Lab Number</th>
              <th>Shift</th>
              <th>Unit</th>
              <th>Lab Section</th>
              <th>Test Name</th>
              <th className="text-center">Urgent</th>
              <th className="text-center">Received</th>
              <th className="text-center">Resulted</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-gray-400">
                  No data available
                </td>
              </tr>
            ) : (
              filteredData.map((test) => (
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
                  <td className="font-mono text-highlight">{test.lab_no}</td>
                  <td>{test.shift}</td>
                  <td>{test.laboratory}</td>
                  <td>{test.lab_section_at_test}</td>
                  <td>{test.test_name}</td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={test.is_urgent}
                      onChange={(e) =>
                        onUpdateStatus(test.id, { isUrgent: e.target.checked })
                      }
                      disabled={test.is_cancelled}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={test.is_received}
                      onChange={(e) =>
                        onUpdateStatus(test.id, { isReceived: e.target.checked })
                      }
                      disabled={test.is_cancelled}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={test.is_resulted}
                      onChange={(e) =>
                        onUpdateStatus(test.id, { isResulted: e.target.checked })
                      }
                      disabled={test.is_cancelled}
                    />
                  </td>
                  <td className="text-center">
                    {!test.is_cancelled ? (
                      <button
                        onClick={() => openCancelModal(test.id)}
                        className="bg-danger text-white px-3 py-1 rounded text-sm hover:opacity-80"
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-danger text-sm">Cancelled</span>
                    )}
                  </td>
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
              className="w-full h-32"
              placeholder="Enter reason..."
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