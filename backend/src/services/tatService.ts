import { query } from '../config/database';
import { FilterParams } from '../types';
import { getPeriodDates } from '../utils/dateUtils';

export const getTATData = async (filters: FilterParams) => {
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

  const whereClause = conditions.join(' AND ');

  // Get total tests
  const totalResult = await query(
    `SELECT COUNT(*) as total FROM test_records WHERE ${whereClause}`,
    params
  );
  const totalTests = parseInt(totalResult.rows[0].total);

  // Get delayed tests (actual_tat > tat_at_test)
  const delayedResult = await query(
    `SELECT COUNT(*) as delayed 
     FROM test_records 
     WHERE ${whereClause} AND actual_tat > tat_at_test AND time_out IS NOT NULL`,
    params
  );
  const delayedTests = parseInt(delayedResult.rows[0].delayed);

  // Get on-time tests
  const onTimeResult = await query(
    `SELECT COUNT(*) as ontime 
     FROM test_records 
     WHERE ${whereClause} AND actual_tat <= tat_at_test AND time_out IS NOT NULL`,
    params
  );
  const onTimeTests = parseInt(onTimeResult.rows[0].ontime);

  // Get not uploaded tests
  const notUploadedTests = totalTests - (delayedTests + onTimeTests);

  // Calculate percentages
  const delayedPercentage = totalTests > 0 ? (delayedTests / totalTests) * 100 : 0;
  const onTimePercentage = totalTests > 0 ? (onTimeTests / totalTests) * 100 : 0;

  // Calculate daily averages
  const daysInPeriod = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const avgDailyDelayed = delayedTests / daysInPeriod;
  const avgDailyOnTime = onTimeTests / daysInPeriod;
  const avgDailyNotUploaded = notUploadedTests / daysInPeriod;

  // Get daily trend
  const dailyTrendResult = await query(
    `SELECT 
      encounter_date::date as date,
      COUNT(CASE WHEN actual_tat > tat_at_test AND time_out IS NOT NULL THEN 1 END) as delayed,
      COUNT(CASE WHEN actual_tat <= tat_at_test AND time_out IS NOT NULL THEN 1 END) as onTime,
      COUNT(CASE WHEN time_out IS NULL THEN 1 END) as notUploaded
     FROM test_records 
     WHERE ${whereClause}
     GROUP BY encounter_date::date 
     ORDER BY encounter_date::date`,
    params
  );

  // Get hourly trend (from time_in)
  const hourlyTrendResult = await query(
    `SELECT 
      EXTRACT(HOUR FROM time_in) as hour,
      COUNT(CASE WHEN actual_tat > tat_at_test AND time_out IS NOT NULL THEN 1 END) as delayed,
      COUNT(CASE WHEN actual_tat <= tat_at_test AND time_out IS NOT NULL THEN 1 END) as onTime
     FROM test_records 
     WHERE ${whereClause}
     GROUP BY EXTRACT(HOUR FROM time_in)
     ORDER BY hour`,
    params
  );

  // Find most delayed hour and day
  const mostDelayedHour = hourlyTrendResult.rows.reduce((max, row) => 
    parseInt(row.delayed) > parseInt(max.delayed || 0) ? row : max, {});
  
  const mostDelayedDay = dailyTrendResult.rows.reduce((max, row) => 
    parseInt(row.delayed) > parseInt(max.delayed || 0) ? row : max, {});

  // Format the response to match frontend expectations
  return {
    pieData: {
      delayed: delayedTests,
      onTime: onTimeTests,
      notUploaded: notUploadedTests,
    },
    dailyTrend: dailyTrendResult.rows.map(row => ({
      date: new Date(row.date).toISOString().split('T')[0],
      delayed: parseInt(row.delayed),
      onTime: parseInt(row.on_time),
      notUploaded: parseInt(row.not_uploaded),
    })),
    hourlyTrend: hourlyTrendResult.rows.map(row => ({
      hour: parseInt(row.hour),
      delayed: parseInt(row.delayed),
      onTime: parseInt(row.ontime),
      notUploaded: 0, // Not available in hourly data
    })),
    kpis: {
      totalRequests: totalTests,
      delayedRequests: delayedTests,
      onTimeRequests: onTimeTests,
      avgDailyDelayed,
      avgDailyOnTime,
      avgDailyNotUploaded,
      mostDelayedHour: mostDelayedHour.hour ? `${mostDelayedHour.hour}:00 - ${parseInt(mostDelayedHour.hour) + 1}:00` : 'N/A',
      mostDelayedDay: mostDelayedDay.date ? new Date(mostDelayedDay.date).toLocaleDateString() : 'N/A',
    }
  };
};