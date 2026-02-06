export interface User {
  id: number;
  username: string;
  role: 'admin' | 'manager' | 'technician' | 'viewer';
  client_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestMetadata {
  id: number;
  test_name: string;
  tat: number;
  lab_section: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  section_description?: string;
}

export interface LabSection {
  id: number;
  section_name: string;
  description?: string;
  test_count: number;
  created_at: string;
  updated_at: string;
}

export interface RevenueData {
  id: number;
  lab_number: string;
  invoice_no: string;
  test_name: string;
  price: number;
  date: string;
  lab_section: string;
  shift: string;
  hospital_unit: string;
  client_id?: number;
  created_at: string;
}

export interface MonthlyTarget {
  id: number;
  year: number;
  month: number;
  target_amount: number;
  created_at: string;
}

export interface UnmatchedTest {
  id: number;
  test_name: string;
  occurrences: number;
  last_seen: string;
  status: 'pending' | 'added' | 'ignored';
  created_at: string;
}

export interface LRIDSData {
  lab_number: string;
  date: string;
  shift: string;
  unit: string;
  test_name: string;
  tat: number;
  request_time_expected: string;
  status: 'cancelled' | 'pending' | 'overdue' | 'urgent';
  cancellation_reason?: string;
  progress: string;
  minutes_remaining: number;
}

export interface CancelledTest {
  id: number;
  lab_number: string;
  test_name: string;
  reason?: string;
  cancelled_by: number;
  cancelled_by_name: string;
  refund_amount?: number;
  original_price: number;
  cancelled_at: string;
}

export interface DashboardStats {
  today: {
    revenue: number;
    tests: number;
    pending: number;
    overdue: number;
  };
  alerts: {
    unmatchedTests: number;
  };
}

export interface RevenueAggregations {
  dailyRevenue: Array<{
    date: string;
    total_revenue: number;
    test_count: number;
  }>;
  bySection: Array<{
    lab_section: string;
    total_revenue: number;
    test_count: number;
  }>;
  byUnit: Array<{
    hospital_unit: string;
    total_revenue: number;
    test_count: number;
  }>;
  byTest: Array<{
    test_name: string;
    total_revenue: number;
    test_count: number;
  }>;
}

export interface RevenueKPIs {
  totalRevenue: number;
  testCount: number;
  dayCount: number;
  avgDailyRevenue: number;
  avgDailyTests: number;
  revenueGrowthRate: number;
  prevTotalRevenue: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}

export interface FilterParams {
  startDate?: string;
  endDate?: string;
  labSection?: string;
  shift?: string;
  hospitalUnit?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}