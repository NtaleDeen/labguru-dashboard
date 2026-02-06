export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'manager' | 'technician' | 'viewer';
  is_active: boolean;
  created_at: Date;
}

export interface TestMetadata {
  id?: number;
  test_name: string;
  tat: number;
  section: string;
  price: number;
  last_updated?: Date;
}

export interface ReceptionRecord {
  lab_number: string;
  test_name: string;
  date: string;
  shift: string;
  unit: string;
  lab_section: string;
  time_received?: Date;
  test_time_out?: Date;
  urgency?: 'normal' | 'urgent';
  cancelled?: boolean;
  cancel_reason?: string;
}

export interface RevenueData {
  date: string;
  lab_number: string;
  test_name: string;
  price: number;
  section: string;
  shift: string;
  unit: string;
}

export interface UnmatchedTest {
  test_name: string;
  count: number;
  first_seen: Date;
  last_seen: Date;
}