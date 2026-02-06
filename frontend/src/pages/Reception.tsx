import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '../utils/api';
import { toast } from 'react-hot-toast';
import { formatDateTime, formatCurrency } from '../utils/dateUtils';
import { AuthService } from '../utils/auth';
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';

interface ReceptionData {
  id: number;
  lab_number: string;
  test_name: string;
  date: string;
  shift: string;
  unit: string;
  lab_section: string;
  time_received?: string;
  test_time_out?: string;
  urgency: string;
  price: number;
}

interface FilterForm {
  startDate: string;
  endDate: string;
  period: string;
  labSection: string;
  shift: string;
  hospitalUnit: string;
  searchQuery: string;
}

const Reception: React.FC = () => {
  const [data, setData] = useState<ReceptionData[]>([]);
  const [filteredData, setFilteredData] = useState<ReceptionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<'receive' | 'result' | 'urgent' | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 20;

  const { register, handleSubmit, watch, setValue } = useForm<FilterForm>({
    defaultValues: {
      period: 'today',
      labSection: 'all',
      shift: 'all',
      hospitalUnit: 'all',
      searchQuery: '',
    },
  });

  const period = watch('period');

  useEffect(() => {
    // Set date range based on period
    const today = new Date().toISOString().split('T')[0];
    if (period === 'today') {
      setValue('startDate', today);
      setValue('endDate', today);
    } else if (period === 'last7Days') {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 6);
      setValue('startDate', lastWeek.toISOString().split('T')[0]);
      setValue('endDate', today);
    } else if (period === 'thisMonth') {
      const firstDay = new Date();
      firstDay.setDate(1);
      setValue('startDate', firstDay.toISOString().split('T')[0]);
      setValue('endDate', today);
    }
  }, [period, setValue]);

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async (filters?: FilterForm) => {
    setIsLoading(true);
    try {
      const filterValues = filters || {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        period: 'today',
        labSection: 'all',
        shift: 'all',
        hospitalUnit: 'all',
        searchQuery: '',
      };

      const response = await api.getRevenueData({
        start_date: filterValues.startDate,
        end_date: filterValues.endDate,
        labSection: filterValues.labSection !== 'all' ? filterValues.labSection : undefined,
        shift: filterValues.shift !== 'all' ? filterValues.shift : undefined,
        hospitalUnit: filterValues.hospitalUnit !== 'all' ? filterValues.hospitalUnit : undefined,
        searchQuery: filterValues.searchQuery || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });

      // Transform revenue data to reception format
      const receptionData: ReceptionData[] = (response.data || []).map((item: any) => ({
        id: item.id,
        lab_number: item.lab_number,
        test_name: item.test_name,
        date: item.date,
        shift: item.shift,
        unit: item.hospital_unit,
        lab_section: item.lab_section,
        time_received: undefined,
        test_time_out: undefined,
        urgency: 'normal',
        price: item.price,
      }));

      setData(receptionData);
      setFilteredData(receptionData);
      setTotalRecords(response.total || 0);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Failed to load reception data:', error);
      toast.error('Failed to load reception data');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: FilterForm) => {
    setCurrentPage(1);
    loadData(data);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredData.map(item => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleReceive = async (id?: number) => {
    try {
      const ids = id ? [id] : Array.from(selectedRows);
      if (ids.length === 0) {
        toast.error('Please select at least one test');
        return;
      }

      // Update locally first for instant feedback
      setData(prev => prev.map(item => 
        ids.includes(item.id) ? { ...item, time_received: new Date().toISOString() } : item
      ));

      // TODO: Call API to update in database
      toast.success(`${ids.length} test(s) marked as received`);
      
      // Clear selection
      setSelectedRows(new Set());
    } catch (error) {
      toast.error('Failed to update test status');
    }
  };

  const handleResult = async (id?: number) => {
    try {
      const ids = id ? [id] : Array.from(selectedRows);
      if (ids.length === 0) {
        toast.error('Please select at least one test');
        return;
      }

      // Check if all selected tests have been received
      const unreceivedTests = data.filter(item => 
        ids.includes(item.id) && !item.time_received
      );

      if (unreceivedTests.length > 0) {
        toast.error('Some selected tests have not been received yet');
        return;
      }

      // Update locally first for instant feedback
      setData(prev => prev.map(item => 
        ids.includes(item.id) ? { ...item, test_time_out: new Date().toISOString() } : item
      ));

      // TODO: Call API to update in database
      toast.success(`${ids.length} test(s) marked as resulted`);
      
      // Clear selection
      setSelectedRows(new Set());
    } catch (error) {
      toast.error('Failed to update test status');
    }
  };

  const handleUrgent = async (id?: number) => {
    try {
      const ids = id ? [id] : Array.from(selectedRows);
      if (ids.length === 0) {
        toast.error('Please select at least one test');
        return;
      }

      // Update locally first for instant feedback
      setData(prev => prev.map(item => 
        ids.includes(item.id) ? { ...item, urgency: 'urgent' } : item
      ));

      // TODO: Call API to update in database
      toast.success(`${ids.length} test(s) marked as urgent`);
      
      // Clear selection
      setSelectedRows(new Set());
    } catch (error) {
      toast.error('Failed to update test status');
    }
  };

  const handleCancel = async (id: number, reason: string) => {
    if (!reason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    try {
      await api.cancelTest({
        lab_number: data.find(item => item.id === id)?.lab_number,
        test_name: data.find(item => item.id === id)?.test_name,
        reason,
      });

      // Remove from list
      setData(prev => prev.filter(item => item.id !== id));
      setFilteredData(prev => prev.filter(item => item.id !== id));
      
      toast.success('Test cancelled successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel test');
    }
  };

  const getStatusBadge = (item: ReceptionData) => {
    if (item.test_time_out) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Resulted
        </span>
      );
    }
    if (item.time_received) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 flex items-center">
          <QueueListIcon className="h-3 w-3 mr-1" />
          In Progress
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center">
        <ClockIcon className="h-3 w-3 mr-1" />
        Pending
      </span>
    );
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Reception Desk</h1>
            <p className="mt-1 text-gray-600">
              Register, track, and manage laboratory tests
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm text-gray-600">Pending Tests</p>
              <p className="text-lg font-bold text-primary">
                {data.filter(item => !item.time_received).length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center">
              <QueueListIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
       