import React from 'react';
import { FilterParams } from '../../types';

interface FiltersProps {
  filters: FilterParams;
  onFilterChange: (key: keyof FilterParams, value: string) => void;
  onReset: () => void;
  showPeriodFilter?: boolean;
  showLabSectionFilter?: boolean;
  showShiftFilter?: boolean;
  showLaboratoryFilter?: boolean;
}

const Filters: React.FC<FiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  showPeriodFilter = true,
  showLabSectionFilter = true,
  showShiftFilter = true,
  showLaboratoryFilter = true,
}) => {
  return (
    <div className="dashboard-filters" id="filters">
      <div className="filter-group">
        <button onClick={onReset} className="logout-button">
          Reset Filters
        </button>
      </div>
      <div className="filter-group">
        <label htmlFor="startDateFilter">Start Date:</label>
        <input
          type="date"
          id="startDateFilter"
          value={filters.startDate || ''}
          onChange={(e) => onFilterChange('startDate', e.target.value)}
        />
      </div>
      
      <div className="filter-group">
        <label htmlFor="endDateFilter">End Date:</label>
        <input
          type="date"
          id="endDateFilter"
          value={filters.endDate || ''}
          onChange={(e) => onFilterChange('endDate', e.target.value)}
        />
      </div>
      
      {showPeriodFilter && (
        <div className="filter-group">
          <label htmlFor="periodSelect">Period:</label>
          <select
            id="periodSelect"
            value={filters.period || 'custom'}
            onChange={(e) => onFilterChange('period', e.target.value)}
          >
            <option value="custom">Custom</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisQuarter">This Quarter</option>
            <option value="lastQuarter">Last Quarter</option>
          </select>
        </div>
      )}
      
      {showLabSectionFilter && (
        <div className="filter-group">
          <label htmlFor="labSectionFilter">Lab Section:</label>
          <select
            id="labSectionFilter"
            value={filters.labSection || 'all'}
            onChange={(e) => onFilterChange('labSection', e.target.value)}
          >
            <option value="all">All</option>
            <option value="chemistry">Chemistry</option>
            <option value="heamatology">Heamatology</option>
            <option value="microbiology">Microbiology</option>
            <option value="serology">Serology</option>
            <option value="referral">Referral</option>
          </select>
        </div>
      )}
      
      {showShiftFilter && (
        <div className="filter-group">
          <label htmlFor="shiftFilter">Shift:</label>
          <select
            id="shiftFilter"
            value={filters.shift || 'all'}
            onChange={(e) => onFilterChange('shift', e.target.value)}
          >
            <option value="all">All</option>
            <option value="day shift">Day Shift</option>
            <option value="night shift">Night Shift</option>
          </select>
        </div>
      )}
      
      {showLaboratoryFilter && (
        <div className="filter-group">
          <label htmlFor="hospitalUnitFilter">Laboratory:</label>
          <select
            id="hospitalUnitFilter"
            value={filters.laboratory || 'all'}
            onChange={(e) => onFilterChange('laboratory', e.target.value)}
          >
            <option value="all">All</option>
            <option value="mainLab">Main Laboratory</option>
            <option value="annex">Annex</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default Filters;