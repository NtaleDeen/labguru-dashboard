import { query } from '../config/database';
import { FilterParams } from '../types';
import { getPeriodDates } from '../utils/dateUtils';
import { getNumbersTargetForPeriod } from './numbersTargetService';
import moment from 'moment';

export const getNumbersData = async (filters: FilterParams) => {
  let startDate: Date;
  let endDate: Date;

  // Handle period or custom date range
  if (filters.period && filters.period !== 'custom') {
    const dates = getPeriodDates(filters.period);
    startDate = dates.startDate;
    endDate = dates.endDate;
  } else {
    startDate = filters.startDate ? new Date(filters.startDate) : new Date();
    endDate = filters.endDate ? new Date(filters.endDate) : new Date();
  }

  // Build WHERE clause
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

  // Get target for the period
  const targetRequests = await getNumbersTargetForPeriod(startDate, endDate);
  
  // Calculate percentage
  const percentage = targetRequests > 0 
    ? (totalRequests / targetRequests) * 100 
    : 0;

  // Calculate average daily requests
  const daysInPeriod = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
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

  const dailyVolume = dailyVolumeResult.rows.map(row => ({
    date: moment(row.date).format('YYYY-MM-DD'),
    count: parseInt(row.count)
  }));

  // Get hourly volume
  const hourlyVolumeResult = await query(
    `SELECT EXTRACT(HOUR FROM time_in) as hour, COUNT(*) as count
     FROM test_records 
     WHERE ${whereClause}
     GROUP BY EXTRACT(HOUR FROM time_in)
     ORDER BY hour`,
    params
  );

  const hourlyVolume = Array.from({ length: 24 }, (_, hour) => {
    const found = hourlyVolumeResult.rows.find(row => parseInt(row.hour) === hour);
    return {
      hour,
      count: found ? parseInt(found.count) : 0
    };
  });

  // Find busiest hour and day
  const busiestHourRow = hourlyVolumeResult.rows.reduce((max, row) => 
    parseInt(row.count) > parseInt(max.count || 0) ? row : max, {});
  
  const busiestDayRow = dailyVolumeResult.rows.reduce((max, row) => 
    parseInt(row.count) > parseInt(max.count || 0) ? row : max, {});

  const busiestHour = busiestHourRow.hour 
    ? `${busiestHourRow.hour}:00 - ${parseInt(busiestHourRow.hour) + 1}:00` 
    : 'N/A';
  
  const busiestDay = busiestDayRow.date 
    ? `${moment(busiestDayRow.date).format('MMM DD, YYYY')} (${busiestDayRow.count} requests)` 
    : 'N/A';

  return {
    totalRequests,
    targetRequests,
    percentage,
    avgDailyRequests,
    busiestHour,
    busiestDay,
    dailyVolume,
    hourlyVolume,
  };
};