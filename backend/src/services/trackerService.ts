import { query } from '../config/database';
import { FilterParams } from '../types';
import { getPeriodDates } from '../utils/dateUtils';

export const getTrackerData = async (filters: FilterParams, search?: string) => {
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

  const conditions = ['encounter_date BETWEEN $1 AND $2', 'is_cancelled = false'];
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

  if (search) {
    conditions.push(`(LOWER(test_name) LIKE LOWER($${paramCount}) OR LOWER(lab_no) LIKE LOWER($${paramCount}))`);
    params.push(`%${search}%`);
    paramCount++;
  }

  const whereClause = conditions.join(' AND ');

  // Use normalized schema: JOIN test_records with encounters
  // This prevents duplicate lab_no in results when filtering by test name
  const result = await query(
    `SELECT
      tr.id,
      e.encounter_date,
      e.lab_no,
      e.invoice_no,
      e.source,
      e.time_in,
      e.shift,
      e.laboratory,
      tr.test_name,
      tr.lab_section_at_test,
      tr.is_urgent,
      tr.is_received,
      tr.time_out,
      tr.actual_tat,
      tr.tat_at_test,
      (e.time_in + (tr.tat_at_test || ' minutes')::INTERVAL) as time_expected
     FROM test_records tr
     JOIN encounters e ON tr.encounter_id = e.lab_no
     WHERE ${whereClause}
     ORDER BY e.encounter_date DESC, e.time_in DESC`,
    params
  );

  return result.rows;
};