import { query } from '../config/database';
import moment from 'moment';

export const getNumbersTarget = async (month: number, year: number) => {
  const result = await query(
    `SELECT target_count FROM monthly_numbers_targets 
     WHERE month = $1 AND year = $2`,
    [month, year]
  );

  if (result.rows.length === 0) {
    return 15000; // Default 15K requests per month
  }

  return parseInt(result.rows[0].target_count);
};

export const setNumbersTarget = async (
  month: number,
  year: number,
  target: number,
  userId: number
) => {
  await query(
    `INSERT INTO monthly_numbers_targets (month, year, target_count, updated_by) 
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (month, year) 
     DO UPDATE SET 
       target_count = $3, 
       updated_at = CURRENT_TIMESTAMP, 
       updated_by = $4`,
    [month, year, target, userId]
  );

  // Log audit
  await query(
    `INSERT INTO audit_log (user_id, action, table_name, new_values) 
     VALUES ($1, $2, $3, $4)`,
    [userId, 'SET_NUMBERS_TARGET', 'monthly_numbers_targets', JSON.stringify({ month, year, target })]
  );

  return { month, year, target };
};

export const getCurrentMonthNumbersTarget = async () => {
  const currentMonth = moment().month() + 1;
  const currentYear = moment().year();
  return await getNumbersTarget(currentMonth, currentYear);
};

export const getAllNumbersTargets = async () => {
  const result = await query(
    `SELECT month, year, target_count, updated_at, updated_by
     FROM monthly_numbers_targets 
     ORDER BY year DESC, month DESC`
  );

  return result.rows.map(row => ({
    month: row.month,
    year: row.year,
    target: parseInt(row.target_count),
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
  }));
};

export const getNumbersTargetForPeriod = async (startDate: Date, endDate: Date) => {
  const startMoment = moment(startDate);
  const endMoment = moment(endDate);
  
  // Calculate total target for the period
  let totalTarget = 0;
  let current = startMoment.clone().startOf('month');
  
  while (current.isSameOrBefore(endMoment, 'month')) {
    const monthTarget = await getNumbersTarget(current.month() + 1, current.year());
    
    // Calculate what portion of this month is in our date range
    const monthStart = moment.max(current.clone().startOf('month'), startMoment);
    const monthEnd = moment.min(current.clone().endOf('month'), endMoment);
    const daysInRange = monthEnd.diff(monthStart, 'days') + 1;
    const daysInMonth = current.daysInMonth();
    
    totalTarget += (monthTarget * daysInRange) / daysInMonth;
    
    current.add(1, 'month');
  }
  
  return Math.round(totalTarget);
};