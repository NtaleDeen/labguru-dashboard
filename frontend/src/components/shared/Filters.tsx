import React, { useEffect, useState } from 'react';
import { FilterParams } from '../../types';
import api from '../../services/api';

interface FiltersProps {
  filters: FilterParams;
  onFilterChange: (key: keyof FilterParams, value: string) => void;
  onReset?: () => void;
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
  const [labSections, setLabSections] = useState<string[]>([]);

  useEffect(() => {
    // Fetch available lab sections dynamically
    if (showLabSectionFilter) {
      api.get('/revenue/lab-sections')
        .then(response => setLabSections(response.data))
        .catch(error => console.error('Error fetching lab sections:', error));
    }
  }, [showLabSectionFilter]);

  return (
    <div className="bg-secondary p-4 rounded-lg border border-highlight/20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Start Date
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            End Date
          </label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            className="w-full"
          />
        </div>

        {showPeriodFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Period
            </label>
            <select
              value={filters.period || 'custom'}
              onChange={(e) => onFilterChange('period', e.target.value)}
              className="w-full"
            >
              <option value="custom">Custom</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <optgroup label="Quarters">
                <option value="Q1">Q1 (Jan-Mar)</option>
                <option value="Q2">Q2 (Apr-Jun)</option>
                <option value="Q3">Q3 (Jul-Sep)</option>
                <option value="Q4">Q4 (Oct-Dec)</option>
                <option value="thisQuarter">This Quarter</option>
                <option value="lastQuarter">Last Quarter</option>
              </optgroup>
              <optgroup label="Months">
                <option value="january">January</option>
                <option value="february">February</option>
                <option value="march">March</option>
                <option value="april">April</option>
                <option value="may">May</option>
                <option value="june">June</option>
                <option value="july">July</option>
                <option value="august">August</option>
                <option value="september">September</option>
                <option value="october">October</option>
                <option value="november">November</option>
                <option value="december">December</option>
              </optgroup>
            </select>
          </div>
        )}

        {showLabSectionFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lab Section
            </label>
            <select
              value={filters.labSection || 'all'}
              onChange={(e) => onFilterChange('labSection', e.target.value)}
              className="w-full"
            >
              <option value="all">All</option>
              {labSections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>
        )}

        {showShiftFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Shift
            </label>
            <select
              value={filters.shift || 'all'}
              onChange={(e) => onFilterChange('shift', e.target.value)}
              className="w-full"
            >
              <option value="all">All</option>
              <option value="day shift">Day Shift</option>
              <option value="night shift">Night Shift</option>
            </select>
          </div>
        )}

        {showLaboratoryFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Laboratory
            </label>
            <select
              value={filters.laboratory || 'all'}
              onChange={(e) => onFilterChange('laboratory', e.target.value)}
              className="w-full"
            >
              <option value="all">All</option>
              <option value="mainLab">Main Laboratory</option>
              <option value="annex">Annex</option>
            </select>
          </div>
        )}
      </div>

      {onReset && (
        <div className="mt-4 flex justify-end">
          <button onClick={onReset} className="btn-secondary text-sm">
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Filters;