// frontend/src/pages/Meta.tsx
import React, { useState, useEffect } from 'react';
import { Header, Navbar, Filters, Loader, Modal } from '@/components/shared';
import { MetaTable, type MetaRecord } from '@/components/tables';

const Meta: React.FC = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    labSection: 'all',
    search: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<MetaRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MetaRecord | null>(null);
  
  // Form state for modal
  const [formData, setFormData] = useState({
    testName: '',
    category: '',
    section: 'Chemistry',
    price: 0,
    expectedTAT: 60,
    status: 'active' as 'active' | 'inactive' | 'archived'
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.labSection && filters.labSection !== 'all') params.append('labSection', filters.labSection);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/meta?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch meta data');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching meta data:', error);
      // Mock data for development
      setData([
        {
          id: 1,
          testName: 'Complete Blood Count',
          category: 'Hematology',
          section: 'Hematology',
          price: 25000,
          expectedTAT: 60,
          status: 'active'
        },
        {
          id: 2,
          testName: 'Liver Function Test',
          category: 'Chemistry',
          section: 'Chemistry',
          price: 35000,
          expectedTAT: 90,
          status: 'active'
        },
        {
          id: 3,
          testName: 'Malaria Parasite',
          category: 'Microbiology',
          section: 'Microbiology',
          price: 15000,
          expectedTAT: 45,
          status: 'active'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      labSection: 'all',
      search: ''
    });
  };

  const handleEdit = (id: number) => {
    const record = data.find(item => item.id === id);
    if (record) {
      setEditingRecord(record);
      setFormData({
        testName: record.testName,
        category: record.category,
        section: record.section,
        price: record.price,
        expectedTAT: record.expectedTAT,
        status: record.status
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      console.log('Deleting record:', id);
      // API call to delete record
      setData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setFormData({
      testName: '',
      category: '',
      section: 'Chemistry',
      price: 0,
      expectedTAT: 60,
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      console.log('Saving record:', editingRecord ? 'Update' : 'Create', formData);
      
      const token = localStorage.getItem('token');
      const url = editingRecord 
        ? `/api/meta/${editingRecord.id}` 
        : '/api/meta';
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(`Test ${editingRecord ? 'updated' : 'created'} successfully`);
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(`Failed to ${editingRecord ? 'update' : 'create'} test`);
      }
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Error saving test');
    }
  };

  const handleExportCSV = () => {
    console.log('Exporting CSV...');
    // CSV export logic here
  };

  return (
    <div className="min-h-screen bg-background-color">
      <Header
        title="Nakasero Hospital Laboratory"
        pageTitle="Meta Table"
        onLogout={handleLogout}
        onResetFilters={handleResetFilters}
        showResetFilters={true}
        menuItems={[
          { label: 'Export CSV', href: '#', icon: 'fas fa-file-csv', onClick: handleExportCSV },
          { label: 'Admin Panel', href: '/admin', icon: 'fas fa-cog' },
          { label: 'Reception Table', href: '/reception', icon: 'fas fa-table' },
          { label: 'Progress Table', href: '/progress', icon: 'fas fa-chart-bar' },
          { label: 'Performance Table', href: '/performance', icon: 'fas fa-chart-line' },
          { label: 'Tracker Table', href: '/tracker', icon: 'fas fa-list' },
          { label: 'Dashboard', href: '/dashboard', icon: 'fas fa-home' }
        ]}
      />

      <Navbar type="table" />

      <div className="main-search-container">
        <div className="search-actions-row">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search test name..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <i className="fas fa-search search-icon"></i>
          </div>
        </div>
        <Filters
          filters={filters}
          onFilterChange={handleFilterChange}
          showPeriodFilter={false}
          showLabSectionFilter={true}
          showShiftFilter={false}
          showLaboratoryFilter={false}
        />
      </div>

      <main>
        {isLoading ? (
          <Loader isLoading={true} />
        ) : (
          <section className="card">
            <MetaTable
              data={data}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
              isLoading={isLoading}
            />
          </section>
        )}
      </main>

      {/* ✅ FIXED: Modal with connected form state */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Edit Test' : 'Add New Test'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.testName}
              onChange={(e) => handleFormChange('testName', e.target.value)}
              placeholder="Enter test name"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
                placeholder="Enter category"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.section}
                onChange={(e) => handleFormChange('section', e.target.value)}
              >
                <option value="Chemistry">Chemistry</option>
                <option value="Hematology">Hematology</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Immunology">Immunology</option>
                <option value="Molecular">Molecular</option>
                <option value="Serology">Serology</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (UGX) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.price}
                onChange={(e) => handleFormChange('price', parseInt(e.target.value) || 0)}
                placeholder="Enter price"
                min="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected TAT (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.expectedTAT}
                onChange={(e) => handleFormChange('expectedTAT', parseInt(e.target.value) || 60)}
                placeholder="Enter TAT"
                min="1"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={(e) => handleFormChange('status', e.target.value as any)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.testName || !formData.section || formData.price <= 0 || formData.expectedTAT <= 0}
            className="px-4 py-2 text-sm font-medium text-white bg-main-color rounded-md hover:bg-hover-color focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingRecord ? 'Update' : 'Create'}
          </button>
        </div>
      </Modal>

      <div className="notice">
        <p>Sorry! You need a wider screen to view the table.</p>
      </div>

      <footer>
        <p>&copy;2025 Zyntel</p>
        <div className="zyntel">
          <img src="/images/zyntel_no_background.png" alt="logo" />
        </div>
      </footer>
    </div>
  );
};

export default Meta;