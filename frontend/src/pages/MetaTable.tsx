import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../utils/api';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../utils/dateUtils';
import { AuthService } from '../utils/auth';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const metadataSchema = z.object({
  test_name: z.string().min(1, 'Test name is required'),
  tat: z.number().min(1, 'TAT must be at least 1 minute'),
  lab_section: z.string().min(1, 'Lab section is required'),
  price: z.number().min(0, 'Price cannot be negative'),
});

type MetadataFormData = z.infer<typeof metadataSchema>;

interface TestMetadata {
  id: number;
  test_name: string;
  tat: number;
  lab_section: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UnmatchedTest {
  id: number;
  test_name: string;
  occurrences: number;
  last_seen: string;
  status: 'pending' | 'added' | 'ignored';
  created_at: string;
}

const MetaTable: React.FC = () => {
  const [metadata, setMetadata] = useState<TestMetadata[]>([]);
  const [unmatchedTests, setUnmatchedTests] = useState<UnmatchedTest[]>([]);
  const [filteredMetadata, setFilteredMetadata] = useState<TestMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [editingMetadata, setEditingMetadata] = useState<TestMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [labSectionFilter, setLabSectionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 20;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MetadataFormData>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      test_name: '',
      tat: 60,
      lab_section: 'chemistry',
      price: 0,
    },
  });

  useEffect(() => {
    loadData();
  }, [currentPage, labSectionFilter]);

  useEffect(() => {
    filterMetadata();
  }, [metadata, searchQuery, labSectionFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [metadataRes, unmatchedRes] = await Promise.all([
        api.getMetadata({
          page: currentPage,
          limit: itemsPerPage,
          labSection: labSectionFilter !== 'all' ? labSectionFilter : undefined,
          searchQuery: searchQuery || undefined,
        }),
        api.getUnmatchedTests(),
      ]);

      setMetadata(metadataRes.data || []);
      setFilteredMetadata(metadataRes.data || []);
      setTotalRecords(metadataRes.total || 0);
      setTotalPages(metadataRes.totalPages || 1);
      setUnmatchedTests(unmatchedRes.data || []);
    } catch (error) {
      console.error('Failed to load metadata:', error);
      toast.error('Failed to load metadata');
    } finally {
      setIsLoading(false);
    }
  };

  const filterMetadata = () => {
    let filtered = [...metadata];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.test_name.toLowerCase().includes(query) ||
        item.lab_section.toLowerCase().includes(query)
      );
    }

    if (labSectionFilter !== 'all') {
      filtered = filtered.filter(item => item.lab_section === labSectionFilter);
    }

    setFilteredMetadata(filtered);
  };

  const handleAddMetadata = async (data: MetadataFormData) => {
    try {
      if (editingMetadata) {
        await api.updateMetadata(editingMetadata.id, data);
        toast.success('Test metadata updated successfully');
      } else {
        await api.createMetadata(data);
        toast.success('Test metadata added successfully');
      }
      
      setShowAddModal(false);
      setEditingMetadata(null);
      reset();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (item: TestMetadata) => {
    setEditingMetadata(item);
    setValue('test_name', item.test_name);
    setValue('tat', item.tat);
    setValue('lab_section', item.lab_section);
    setValue('price', item.price);
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate this test?')) {
      return;
    }

    try {
      await api.deleteMetadata(id);
      toast.success('Test deactivated successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Deletion failed');
    }
  };

  const handleAddUnmatched = async (testName: string) => {
    try {
      setValue('test_name', testName);
      setEditingMetadata(null);
      setShowUnmatchedModal(false);
      setShowAddModal(true);
    } catch (error) {
      console.error('Failed to prepare unmatched test:', error);
    }
  };

  const handleIgnoreUnmatched = async (id: number) => {
    try {
      await api.updateMetadata(id, { status: 'ignored' });
      toast.success('Test ignored');
      loadData();
    } catch (error) {
      toast.error('Failed to ignore test');
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await api.importMetadata(file);
      toast.success('Metadata imported successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Import failed');
    } finally {
      event.target.value = '';
    }
  };

  const handleExportCSV = async () => {
    try {
      await api.exportMetadata();
      toast.success('Metadata exported successfully');
    } catch (error: any) {
      toast.error('Export failed');
    }
  };

  const labSections = [
    'chemistry',
    'heamatology',
    'microbiology',
    'serology',
    'referral',
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Metadata</h1>
            <p className="mt-1 text-gray-600">
              Manage test information, TAT, prices, and lab sections
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {AuthService.hasRole(['admin', 'manager']) && (
              <>
                <button
                  onClick={() => {
                    setEditingMetadata(null);
                    reset();
                    setShowAddModal(true);
                  }}
                  className="btn-primary flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Test
                </button>

                {unmatchedTests.length > 0 && (
                  <button
                    onClick={() => setShowUnmatchedModal(true)}
                    className="btn-danger flex items-center"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                    Unmatched Tests ({unmatchedTests.length})
                  </button>
                )}
              </>
            )}

            {AuthService.hasRole(['admin', 'manager']) && (
              <>
                <label className="btn-secondary flex items-center cursor-pointer">
                  <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                  Import CSV
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleImportCSV}
                  />
                </label>

                <button
                  onClick={handleExportCSV}
                  className="btn-secondary flex items-center"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Export CSV
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Tests
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by test name or lab section..."
                className="input-field pl-10"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lab Section
            </label>
            <select
              value={labSectionFilter}
              onChange={(e) => setLabSectionFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Sections</option>
              {labSections.map((section) => (
                <option key={section} value={section}>
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadData}
              className="btn-primary flex items-center w-full"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-6">
          <p className="text-sm font-medium text-gray-600">Total Tests</p>
          <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
          <p className="text-sm text-gray-500">Active in system</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <p className="text-sm font-medium text-gray-600">Unmatched Tests</p>
          <p className="text-2xl font-bold text-red-600">{unmatchedTests.length}</p>
          <p className="text-sm text-gray-500">Require attention</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <p className="text-sm font-medium text-gray-600">Avg. Price</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(
              metadata.reduce((sum, item) => sum + item.price, 0) / metadata.length || 0
            )}
          </p>
          <p className="text-sm text-gray-500">Per test</p>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <p className="text-sm font-medium text-gray-600">Avg. TAT</p>
          <p className="text-2xl font-bold text-gray-900">
            {Math.round(
              metadata.reduce((sum, item) => sum + item.tat, 0) / metadata.length || 0
            )} min
          </p>
          <p className="text-sm text-gray-500">Turnaround time</p>
        </div>
      </div>

      {/* Metadata Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lab Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TAT (minutes)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price (UGX)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {AuthService.hasRole(['admin', 'manager']) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMetadata.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.test_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {item.lab_section}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.tat.toLocaleString()} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {AuthService.hasRole(['admin', 'manager']) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Deactivate"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMetadata.length === 0 && (
          <div className="text-center py-12">
            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No metadata found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || labSectionFilter !== 'all'
                ? 'Try changing your filters'
                : 'Get started by adding your first test'}
            </p>
            {AuthService.hasRole(['admin', 'manager']) && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Test
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, totalRecords)}
                </span>{' '}
                of <span className="font-medium">{totalRecords}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMetadata ? 'Edit Test' : 'Add New Test'}
              </h3>
            </div>
            <form onSubmit={handleSubmit(handleAddMetadata)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name *
                </label>
                <input
                  type="text"
                  {...register('test_name')}
                  className="input-field"
                  placeholder="Enter test name exactly as in LIMS"
                />
                {errors.test_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.test_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TAT (minutes) *
                </label>
                <input
                  type="number"
                  {...register('tat', { valueAsNumber: true })}
                  className="input-field"
                  placeholder="Enter turnaround time in minutes"
                />
                {errors.tat && (
                  <p className="mt-1 text-sm text-red-600">{errors.tat.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lab Section *
                </label>
                <select {...register('lab_section')} className="input-field">
                  <option value="">Select lab section</option>
                  {labSections.map((section) => (
                    <option key={section} value={section}>
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.lab_section && (
                  <p className="mt-1 text-sm text-red-600">{errors.lab_section.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (UGX) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  className="input-field"
                  placeholder="Enter price in UGX"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingMetadata(null);
                    reset();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingMetadata ? 'Update Test' : 'Add Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unmatched Tests Modal */}
      {showUnmatchedModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Unmatched Tests ({unmatchedTests.length})
                </h3>
                <button
                  onClick={() => setShowUnmatchedModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                These test names were found in the data but don't exist in metadata.
                Copy the exact name to add them.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-200">
                {unmatchedTests.map((test) => (
                  <div key={test.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{test.test_name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Seen {test.occurrences} times • Last on{' '}
                          {new Date(test.last_seen).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(test.test_name);
                            toast.success('Test name copied to clipboard');
                          }}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => handleAddUnmatched(test.test_name)}
                          className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary-light"
                        >
                          Add to Metadata
                        </button>
                        <button
                          onClick={() => handleIgnoreUnmatched(test.id)}
                          className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  These tests won't appear in revenue calculations until added to metadata
                </p>
                <button
                  onClick={() => setShowUnmatchedModal(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaTable;