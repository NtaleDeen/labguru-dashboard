import { query } from '../config/database';
import { FilterParams } from '../types';
import { getPeriodDates } from '../utils/dateUtils';

export const getPerformanceData = async (filters: FilterParams) => {
  let startDate: Date;
  let endDate: Date;

  if (filters.period && filters.period !== 'custom') {
    const dates = getPeriodDates(filters.period);
    startDate = dates.startDate;
    endDate = dates.endDate;
  } else {
    startDate = filters.startDate ? new Date(filters.startDate) : new Date();
    endDate = filters.endDate ? new Date(filters.endDate) : new Date();
  }

  const conditions = [
    'encounter_date BETWEEN $1 AND $2',
    'is_cancelled = false',
    'time_out IS NOT NULL',
  ];
  const params: any[] = [startDate, endDate];
  let paramCount = 3;

  if (filters.labSection && filters.labSection !== 'all') {
    conditions.push(`LOWER(lab_section_at_test) = LOWER($${paramCount++})`);
    params.push(filters.labSection);
  }

  if (filters.shift && filters.shift !== 'all') {
    conditions.push(`LOWER(shift) = LOWER($${paramCount++})`);
    params.push(filters.shift);
  }

  if (filters.laboratory && filters.laboratory !== 'all') {
    conditions.push(`laboratory = $${paramCount++}`);
    params.push(filters.laboratory);
  }

  const whereClause = conditions.join(' AND ');

  const result = await query(
    `SELECT 
      id,
      encounter_date,
      lab_no,
      shift,
      laboratory,
      lab_section_at_test,
      test_name,
      time_in,
      time_out,
      actual_tat,
      tat_at_test,
      CASE 
        WHEN actual_tat <= tat_at_test THEN 'on-time'
        WHEN actual_tat > tat_at_test AND (actual_tat - tat_at_test) < 15 THEN 'delayed-less-15'
        ELSE 'over-delayed'
      END as delay_status,
      CASE 
        WHEN actual_tat <= tat_at_test THEN 'Swift'
        WHEN actual_tat > tat_at_test AND (actual_tat - tat_at_test) < 15 THEN '<15min'
        WHEN actual_tat > tat_at_test AND (actual_tat - tat_at_test) BETWEEN 15 AND 60 THEN '15-60min'
        WHEN actual_tat > tat_at_test AND (actual_tat - tat_at_test) BETWEEN 60 AND 180 THEN '1-3hrs'
        WHEN actual_tat > tat_at_test AND (actual_tat - tat_at_test) BETWEEN 180 AND 1440 THEN '3-24hrs'
        ELSE '>24hrs'
      END as time_range
     FROM test_records 
     WHERE ${whereClause}
     ORDER BY encounter_date DESC, time_in DESC`,
    params
  );

  return result.rows;
};