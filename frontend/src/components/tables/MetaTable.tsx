// frontend/src/components/tables/MetaTable.tsx
import React, { useState } from 'react';

export interface MetaRecord {
  id: number;
  testName: string;
  category: string;
  section: string;
  price: number;
  expectedTAT: number;
  status: 'active' | 'inactive' | 'archived';
}

interface MetaTableProps {
  data: MetaRecord[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  isLoading?: boolean;
}

const MetaTable: React.FC<MetaTableProps> = ({
  data,
  onEdit,
  onDelete,
  onAdd,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(record =>
    record.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'fas fa-check-circle text-green-500';
      case 'inactive':
        return 'fas fa-pause-circle text-yellow-500';
      case 'archived':
        return 'fas fa-archive text-gray-500';
      default:
        return 'fas fa-question-circle text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="table-container">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-main-color">Meta Data Table</h2>
          <button className="meta-actions-button" onClick={onAdd}>
            <i className="fas fa-plus mr-2"></i> Add New Test
          </button>
        </div>
        <div className="mb-4">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search test name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="fas fa-search search-icon"></i>
          </div>
        </div>
        <table className="neon-table">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Category</th>
              <th>Section</th>
              <th>Price (UGX)</th>
              <th>Expected TAT</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="text-center">
                <div className="loader-inline">
                  <div className="one"></div>
                  <div className="two"></div>
                  <div className="three"></div>
                  <div className="four"></div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-main-color">Meta Data Table</h2>
        <button className="meta-actions-button" onClick={onAdd}>
          <i className="fas fa-plus mr-2"></i> Add New Test
        </button>
      </div>
      
      <div className="mb-4">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search test name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search search-icon"></i>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-8">
          <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">No tests found matching your search</p>
        </div>
      ) : (
        <table className="neon-table">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Category</th>
              <th>Section</th>
              <th>Price (UGX)</th>
              <th>Expected TAT</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">{row.testName}</td>
                <td>{row.category}</td>
                <td>{row.section}</td>
                <td>{row.price.toLocaleString()}</td>
                <td>{row.expectedTAT} min</td>
                <td>
                  <div className="flex items-center space-x-2">
                    <i className={getStatusIcon(row.status)}></i>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="text-center">
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={() => onEdit(row.id)}
                      className="action-button edit-button"
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => onDelete(row.id)}
                      className="action-button delete-button"
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MetaTable;