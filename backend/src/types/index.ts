export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'manager' | 'technician' | 'viewer';
  client_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TestMetadata {
  id: number;
  test_name: string;
  tat: number; // minutes
  lab_section: string;
  price: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LabSection {
  id: number;
  section_name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MonthlyTarget {
  id: number;
  year: number;
  month: number; // 1-12
  target_amount: number;
  created_at: Date;
}

export interface RevenueData {
  id: number;
  lab_number: string;
  invoice_no: string;
  test_name: string;
  price: number;
  date: Date;
  lab_section: string;
  shift: string;
  hospital_unit: string;
  client_id: number;
}

export interface UnmatchedTest {
  id: number;
  test_name: string;
  occurrences: number;
  last_seen: Date;
  status: 'pending' | 'added' | 'ignored';
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

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  role: string;
  client_id?: number;
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