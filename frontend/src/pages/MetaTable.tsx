import React, { useState, useEffect } from 'react';
import { testsAPI } from '../services/api';
import { Test } from '../types';
import { formatCurrency, formatTAT } from '../utils/formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/authcontext';

const MetaTable: React.FC = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [formData, setFormData] = useState({
    test_name: '',
    lab_section: '',
    tat: 0,
    price: 0,
  });

  const canEdit = user?.role === 'manager' || user?.role === 'technician';
  const canDelete = user?.role === 'manager';

  useEffect(() => {
    fetchTests();
    fetchSections();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await testsAPI.getAll({
        search: searchTerm,
        lab_section: selectedSection,
      });
      setTests(response.data.data);
    } catch (error) {
      toast.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await testsAPI.getSections();
      setSections(response.data.data);
    } catch (error) {
      console.error('Failed to load sections');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTests();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedSection]);

  const handleOpenModal = (test?: Test) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        test_name: test.test_name,
        lab_section: test.lab_section,
        tat: test.tat,
        price: test.price,
      });
    } else {
      setEditingTest(null);
      setFormData({
        test_name: '',
        lab_section: '',
        tat: 0,
        price: 0,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTest(null);
    setFormData({
      test_name: '',
      lab_section: '',
      tat: 0,
      price: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTest) {
        await testsAPI.update(editingTest.id, formData);
        toast.success('Test updated successfully');
      } else {
        await testsAPI.create(formData);
        toast.success('Test created successfully');
      }
      handleCloseModal();
      fetchTests();
      fetchSections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    
    try {
      await testsAPI.delete(id);
      toast.success('Test deleted successfully');
      fetchTests();
      fetchSections();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete test');
    }
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.test_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = !selectedSection || test.lab_section === selectedSection;
    return matchesSearch && matchesSection;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" style={{ color: '#21336a' }}>Meta Table - Test Management</h1>
        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 rounded-lg text-white font-semibold transition hover:opacity-90"
            style={{ backgroundColor: '#21336a' }}
          >
            + Add New Test
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="w-64">
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Sections</option>
            {sections.map((section) => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead style={{ backgroundColor: '#21336a' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Test Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Lab Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">TAT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Price</th>
                {canEdit && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTests.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="px-6 py-8 text-center text-gray-500">
                    No tests found
                  </td>
                </tr>
              ) : (
                filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{test.test_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#deab5f20', color: '#deab5f' }}>
                        {test.lab_section}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatTAT(test.tat)}</td>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#21336a' }}>{formatCurrency(test.price)}</td>
                    {canEdit && (
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleOpenModal(test)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Edit
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Tests</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#21336a' }}>{filteredTests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Lab Sections</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#deab5f' }}>{sections.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Average Price</p>
          <p className="text-2xl font-bold mt-1" style={{ color: '#3b5998' }}>
            {filteredTests.length > 0
              ? formatCurrency(filteredTests.reduce((sum, test) => sum + test.price, 0) / filteredTests.length)
              : formatCurrency(0)}
          </p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold" style={{ color: '#21336a' }}>
                {editingTest ? 'Edit Test' : 'Add New Test'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                <input
                  type="text"
                  value={formData.test_name}
                  onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lab Section</label>
                <input
                  type="text"
                  value={formData.lab_section}
                  onChange={(e) => setFormData({ ...formData, lab_section: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Hematology, Biochemistry"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TAT (hours)</label>
                <input
                  type="number"
                  value={formData.tat}
                  onChange={(e) => setFormData({ ...formData, tat: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (UGX)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  min="0"
                  required
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg text-white font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: '#21336a' }}
                >
                  {editingTest ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaTable;