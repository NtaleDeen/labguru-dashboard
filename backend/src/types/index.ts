import { Request } from 'express';

// User Types
export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export type UserRole = 'manager' | 'technician' | 'viewer';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: UserRole;
  };
}

// Test Types
export interface Test {
  id: string;
  test_name: string;
  lab_section: string;
  tat: number;
  price: number;
  created_at?: Date;
  updated_at?: Date;
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

// Dashboard Stats
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

// LabGuru Scraped Data
export interface LabGuruRecord {
  EncounterDate: string;
  InvoiceNo: string;
  LabNo: string;
  Src: string;
  TestName: string;
}