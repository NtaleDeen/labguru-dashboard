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

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with API call
      const mockData: MetaRecord[] = [
        {
          id: 1,
          testName: 'CBC with Differential',
          category: 'Hematology',
          section: 'Hematology',
          price: 45000,
          expectedTAT: 45,
          status: 'active'
        },
        {
          id: 2,
          testName: 'LFT Comprehensive',
          category: 'Chemistry',
          section: 'Chemistry',
          price: 35000,
          expectedTAT: 60,
          status: 'active'
        },
        {
          id: 3,
          testName: 'RFT',
          category: 'Chemistry',
          section: 'Chemistry',
          price: 30000,
          expectedTAT: 60,
          status: 'active'
        },
        {
          id: 4,
          testName: 'HbA1c',
          category: 'Chemistry',
          section: 'Chemistry',
          price: 25000,
          expectedTAT: 30,
          status: 'active'
        },
        {
          id: 5,
          testName: 'Lipid Profile',
          category: 'Chemistry',
          section: 'Chemistry',
          price: 40000,
          expectedTAT: 60,
          status: 'active'
        },
        {
          id: 6,
          testName: 'Thyroid Profile',
          category: 'Endocrinology',
          section: 'Chemistry',
          price: 50000,
          expectedTAT: 90,
          status: 'inactive'
        },
        {
          id: 7,
          testName: 'HIV Viral Load',
          category: 'Virology',
          section: 'Molecular',
          price: 150000,
          expectedTAT: 180,
          status: 'active'
        },
        {
          id: 8,
          testName: 'Blood Culture',
          category: 'Microbiology',
          section: 'Microbiology',
          price: 75000,
          expectedTAT: 1440,
          status: 'active'
        },
        {
          id: 9,
          testName: 'Malaria Parasite',
          category: 'Parasitology',
          section: 'Microbiology',
          price: 15000,
          expectedTAT: 30,
          status: 'archived'
        },
        {
          id: 10,
          testName: 'Dengue NS1',
          category: 'Serology',
          section: 'Immunology',
          price: 35000,
          expectedTAT: 60,
          status: 'active'
        }
      ];
      
      // Apply filters
      let filteredData = mockData;
      if (filters.labSection !== 'all') {
        filteredData = filteredData.filter(item => 
          item.section.toLowerCase() === filters.labSection.toLowerCase()
        );
      }
      
      setData(filteredData);
      setTimeout(() => setIsLoading(false), 1000);
    } catch (error) {
      console.error('Error fetching meta data:', error);
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    console.log('Logout clicked');
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
    setIsModalOpen(true);
  };

  const handleSave = () => {
    console.log('Saving record:', editingRecord);
    // API call to save record
    setIsModalOpen(false);
    setEditingRecord(null);
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
        showResetFilters={false}
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

      {/* Modal for editing/adding tests */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecord ? 'Edit Test' : 'Add New Test'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              defaultValue={editingRecord?.testName || ''}
              placeholder="Enter test name"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                defaultValue={editingRecord?.category || ''}
                placeholder="Enter category"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="Chemistry">Chemistry</option>
                <option value="Hematology">Hematology</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Immunology">Immunology</option>
                <option value="Molecular">Molecular</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (UGX)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                defaultValue={editingRecord?.price || 0}
                placeholder="Enter price"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected TAT (minutes)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                defaultValue={editingRecord?.expectedTAT || 60}
                placeholder="Enter TAT"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-main-color rounded-md hover:bg-hover-color"
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