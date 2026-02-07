import { query } from '../config/database';
import { FilterParams } from '../types';
import { getPeriodDates } from '../utils/dateUtils';

export const getNumbersData = async (filters: FilterParams) => {
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

  if (filters.shift && filters.shift !== 'all') {
    conditions.push(`LOWER(shift) = LOWER($${paramCount++})`);
    params.push(filters.shift);
  }

  if (filters.laboratory && filters.laboratory !== 'all') {
    conditions.push(`laboratory = $${paramCount++}`);
    params.push(filters.laboratory);
  }

  const whereClause = conditions.join(' AND ');

  // Get total requests
  const totalResult = await query(
    `SELECT COUNT(*) as total FROM test_records WHERE ${whereClause}`,
    params
  );
  const totalRequests = parseInt(totalResult.rows[0].total);

  // Calculate average daily requests
  const daysInPeriod = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const avgDailyRequests = totalRequests / daysInPeriod;

  // Get daily volume
  const dailyVolumeResult = await query(
    `SELECT encounter_date::date as date, COUNT(*) as count
     FROM test_records 
     WHERE ${whereClause}
     GROUP BY encounter_date::date 
     ORDER BY encounter_date::date`,
    params
  );

  // Get hourly volume
  const hourlyVolumeResult = await query(
    `SELECT EXTRACT(HOUR FROM time_in) as hour, COUNT(*) as count
     FROM test_records 
     WHERE ${whereClause}
     GROUP BY EXTRACT(HOUR FROM time_in)
     ORDER BY hour`,
    params
  );

  // Find busiest hour and day
  const busiestHourRow = hourlyVolumeResult.rows.reduce((max, row) => 
    parseInt(row.count) > parseInt(max.count || 0) ? row : max, {});
  
  const busiestDayRow = dailyVolumeResult.rows.reduce((max, row) => 
    parseInt(row.count) > parseInt(max.count || 0) ? row : max, {});

  return {
    totalRequests,
    avgDailyRequests,
    busiestHour: busiestHourRow.hour ? `${busiestHourRow.hour}:00 - ${parseInt(busiestHourRow.hour) + 1}:00` : 'N/A',
    busiestDay: busiestDayRow.date ? `${new Date(busiestDayRow.date).toLocaleDateString()} (${busiestDayRow.count} requests)` : 'N/A',
    dailyVolume: dailyVolumeResult.rows,
    hourlyVolume: hourlyVolumeResult.rows,
  };
};