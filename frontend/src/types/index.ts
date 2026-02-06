// User Types
export interface User {
  id: number;
  username: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

export type UserRole = 'manager' | 'technician' | 'viewer';

// Test Types
export interface Test {
  id: string;
  test_name: string;
  lab_section: string;
  tat: number;
  price: number;
  created_at?: string;
  updated_at?: string;
}

// Revenue Types
export interface DailyRevenue {
  date: string;
  total_revenue: number;
  test_count: number;
}

export interface SectionRevenue {
  lab_section: string;
  total_revenue: number;
  test_count: number;
}

export interface TestRevenue {
  test_name: string;
  lab_section: string;
  price: number;
  test_count: number;
  total_revenue: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalTests: number;
  averagePrice: number;
  topSection: string;
  periodComparison: {
    current: number;
    previous: number;
    percentageChange: number;
  };
}

// Filter Types
export interface RevenueFilters {
  startDate?: string;
  endDate?: string;
  labSection?: string;
  period?: 'daily' | 'monthly' | 'quarterly';
  month?: number;
  quarter?: number;
  year?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}