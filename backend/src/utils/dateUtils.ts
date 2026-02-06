export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculatePercentageChange = (
  previous: number,
  current: number
): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const getDateRange = (days: number): { startDate: string; endDate: string } => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

export const getMonthName = (month: number): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
};

export const getPeriodDates = (
  period: 'daily' | 'monthly' | 'quarterly',
  month?: number,
  quarter?: number,
  year?: number
): { startDate: string; endDate: string } => {
  const currentYear = year || new Date().getFullYear();

  if (period === 'monthly' && month) {
    const startDate = new Date(currentYear, month - 1, 1);
    const endDate = new Date(currentYear, month, 0);
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  }

  if (period === 'quarterly' && quarter) {
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(currentYear, startMonth, 1);
    const endDate = new Date(currentYear, startMonth + 3, 0);
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    };
  }

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

export const buildDateFilter = (
  startDate?: string,
  endDate?: string
): { query: string; params: string[] } => {
  const conditions: string[] = [];
  const params: string[] = [];

  if (startDate) {
    conditions.push(`encounter_date >= $${params.length + 1}`);
    params.push(startDate);
  }

  if (endDate) {
    conditions.push(`encounter_date <= $${params.length + 1}`);
    params.push(endDate);
  }

  const query = conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  return { query, params };
};