import { query } from '../config/database';
import { FilterParams } from '../types';

export const getProgressData = async (filters: FilterParams) => {
  // For progress table, we want today's data by default
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const conditions = ['encounter_date >= $1', 'is_cancelled = false'];
  const params: any[] = [today];
  let paramCount = 2;

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
      test_name,
      shift,
      laboratory,
      lab_section_at_test,
      time_in,
      time_out,
      tat_at_test,
      (time_in + (tat_at_test || ' minutes')::INTERVAL) as time_expected
     FROM test_records 
     WHERE ${whereClause}
     ORDER BY time_in DESC`,
    params
  );

  return result.rows;
};