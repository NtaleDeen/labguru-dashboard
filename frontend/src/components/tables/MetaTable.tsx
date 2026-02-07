import React, { useState } from 'react';
import { TestMetadata } from '../../types';
import Modal from '../shared/Modal';
import { formatCurrency, formatTAT } from '../../utils/formatters';

interface MetaTableProps {
  data: TestMetadata[];
  onAdd: (metadata: Omit<TestMetadata, 'id' | 'is_default'>) => void;
  onUpdate: (id: number, updates: Partial<TestMetadata>, reason?: string) => void;
  onDelete: (id: number) => void;
}

const MetaTable: React.FC<MetaTableProps> = ({ data, onAdd, onUpdate, onDelete }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestMetadata | null>(null);
  const [formData, setFormData] = useState({
    test_name: '',
    current_price: 0,
    current_tat: 1440,
    current_lab_section: '',
    reason: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');

  const openAddModal = () => {
    setEditingTest(null);
    setFormData({
      test_name: '',
      current_price: 0,
      current_tat: 1440,
      current_lab_section: '',
      reason: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (test: TestMetadata) => {
    setEditingTest(test);
    setFormData({
      test_name: test.test_name,
      current_price: test.current_price,
      current_tat: test.current_tat,
      current_lab_section: test.current_lab_section,
      reason: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingTest) {
      onUpdate(
        editingTest.id,
        {
          test_name: formData.test_name,
          current_price: formData.current_price,
          current_tat: formData.current_tat,
          current_lab_section: formData.current_lab_section,
        },
        formData.reason
      );
    } else {
      onAdd({
        test_name: formData.test_name,
        current_price: formData.current_price,
        current_tat: formData.current_tat,
        current_lab_section: formData.current_lab_section,
        created_at: new Date(),
        updated_at: new Date(),
      } as any);
    }
    setModalOpen(false);
  };

  const filteredData = data.filter((test) => {
    const matchesSearch = test.test_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSection =
      sectionFilter === 'all' ||
      test.current_lab_section.toLowerCase() === sectionFilter.toLowerCase();
    return matchesSearch && matchesSection;
  });

  // Get unique lab sections
  const labSections = [...new Set(data.map((t) => t.current_lab_section))];

  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-4 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search test name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="w-48"
        >
          <option value="all">All Sections</option>
          {labSections.map((section) => (
            <option key={section} value={section}>
              {section}
            </option>
          ))}
        </select>
        <button onClick={openAddModal} className="btn-primary">
          Add Test
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="neon-table">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Lab Section</th>
              <th>TAT</th>
              <th>Price</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  No data available
                </td>
              </tr>
            ) : (
              filteredData.map((test) => (
                <tr key={test.id}>
                  <td className="font-medium">{test.test_name}</td>
                  <td>{test.current_lab_section}</td>
                  <td>{formatTAT(test.current_tat)}</td>
                  <td>{formatCurrency(test.current_price)}</td>
                  <td className="text-center space-x-2">
                    <button
                      onClick={() => openEditModal(test)}
                      className="bg-highlight text-white px-3 py-1 rounded text-sm hover:opacity-80"
                    >
                      Edit
                    </button>
                    {test.is_default && (
                      <button
                        onClick={() => onDelete(test.id)}
                        className="bg-danger text-white px-3 py-1 rounded text-sm hover:opacity-80"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTest ? 'Edit Test' : 'Add New Test'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Test Name
            </label>
            <input
              type="text"
              value={formData.test_name}
              onChange={(e) =>
                setFormData({ ...formData, test_name: e.target.value })
              }
              className="w-full"
              placeholder="Enter test name exactly as in LabGuru"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lab Section
            </label>
            <select
              value={formData.current_lab_section}
              onChange={(e) =>
                setFormData({ ...formData, current_lab_section: e.target.value })
              }
              className="w-full"
            >
              <option value="">Select Section</option>
              <option value="CHEMISTRY">Chemistry</option>
              <option value="HEMATOLOGY">Hematology</option>
              <option value="MICROBIOLOGY">Microbiology</option>
              <option value="SEROLOGY">Serology</option>
              <option value="REFERRAL">Referral</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              TAT (minutes)
            </label>
            <input
              type="number"
              value={formData.current_tat}
              onChange={(e) =>
                setFormData({ ...formData, current_tat: parseInt(e.target.value) })
              }
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-1">
              1440 minutes = 24 hours
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price (UGX)
            </label>
            <input
              type="number"
              value={formData.current_price}
              onChange={(e) =>
                setFormData({ ...formData, current_price: parseFloat(e.target.value) })
              }
              className="w-full"
            />
          </div>

          {editingTest && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Change (optional)
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                className="w-full h-20"
                placeholder="e.g., Machine maintenance, price adjustment..."
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary"
              disabled={
                !formData.test_name ||
                !formData.current_lab_section ||
                formData.current_price <= 0
              }
            >
              {editingTest ? 'Update' : 'Add'} Test
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MetaTable;