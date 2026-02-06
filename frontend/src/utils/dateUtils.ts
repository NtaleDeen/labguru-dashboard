import { format, parseISO, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters, eachDayOfInterval, isWithinInterval } from 'date-fns';

export const formatDate = (date: string | Date, formatStr: string = 'dd-MMM-yyyy') => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

export const formatDateTime = (date: string | Date, formatStr: string = 'dd-MMM-yyyy HH:mm') => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
};

export const formatCurrency = (amount: number, currency: string = 'UGX') => {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const getMonthRange = (date: Date = new Date()) => {
  return {
    start: format(startOfMonth(date), 'yyyy-MM-dd'),
    end: format(endOfMonth(date), 'yyyy-MM-dd'),
  };
};

export const getLastMonthRange = () => {
  const lastMonth = subMonths(new Date(), 1);
  return getMonthRange(lastMonth);
};

export const getQuarterRange = (date: Date = new Date()) => {
  return {
    start: format(startOfQuarter(date), 'yyyy-MM-dd'),
    end: format(endOfQuarter(date), 'yyyy-MM-dd'),
  };
};

export const getLastQuarterRange = () => {
  const lastQuarter = subQuarters(new Date(), 1);
  return getQuarterRange(lastQuarter);
};

export const getDateRangeForPeriod = (period: string) => {
  const today = new Date();
  
  switch (period) {
    case 'today':
      const todayStr = format(today, 'yyyy-MM-dd');
      return { start: todayStr, end: todayStr };
    
    case 'thisMonth':
      return getMonthRange(today);
    
    case 'lastMonth':
      return getLastMonthRange();
    
    case 'thisQuarter':
      return getQuarterRange(today);
    
    case 'lastQuarter':
      return getLastQuarterRange();
    
    case 'thisYear':
      return {
        start: format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd'),
        end: format(new Date(today.getFullYear(), 11, 31), 'yyyy-MM-dd'),
      };
    
    case 'lastYear':
      return {
        start: format(new Date(today.getFullYear() - 1, 0, 1), 'yyyy-MM-dd'),
        end: format(new Date(today.getFullYear() - 1, 11, 31), 'yyyy-MM-dd'),
      };
    
    case 'last7Days':
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 6);
      return {
        start: format(last7Days, 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd'),
      };
    
    case 'last30Days':
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 29);
      return {
        start: format(last30Days, 'yyyy-MM-dd'),
        end: format(today, 'yyyy-MM-dd'),
      };
    
    default:
      return getMonthRange(today);
  }
};

export const generateDateRange = (startDate: string, endDate: string): string[] => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  const dates = eachDayOfInterval({ start, end });
  return dates.map(date => format(date, 'yyyy-MM-dd'));
};

export const calculateTAT = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  return diffInMinutes;
};

export const getProgressStatus = (expectedTime: string, currentTime: string = new Date().toISOString()) => {
  const expected = new Date(expectedTime);
  const current = new Date(currentTime);
  
  const diffInMinutes = Math.floor((current.getTime() - expected.getTime()) / (1000 * 60));
  
  if (diffInMinutes > 15) return 'overdue';
  if (diffInMinutes > 0) return 'delayed';
  if (diffInMinutes >= -30) return 'on-time';
  return 'swift';
};