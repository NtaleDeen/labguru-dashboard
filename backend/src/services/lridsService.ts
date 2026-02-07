import { query } from '../config/database';
import moment from 'moment';

export const getLRIDSData = async () => {
  // Get today's tests that are not cancelled
  const today = moment().format('YYYY-MM-DD');

  const result = await query(
    `SELECT 
      lab_no,
      time_in,
      is_received,
      is_resulted,
      time_out
     FROM test_records 
     WHERE encounter_date = $1 
     AND is_cancelled = false
     ORDER BY time_in DESC`,
    [today]
  );

  const lridsData = result.rows.map(row => {
    let progress = 'Pending';

    if (row.is_resulted && row.time_out) {
      progress = 'Ready';
    } else if (row.is_received) {
      progress = 'In Progress';
    }

    return {
      labNo: row.lab_no,
      timeIn: moment(row.time_in).format('hh:mm A'),
      progress,
    };
  });

  // Group by lab number (remove duplicates, show latest status)
  const uniqueData = lridsData.reduce((acc, curr) => {
    const existing = acc.find(item => item.labNo === curr.labNo);
    if (!existing) {
      acc.push(curr);
    } else {
      // Update to most advanced status
      if (curr.progress === 'Ready') {
        existing.progress = 'Ready';
      } else if (curr.progress === 'In Progress' && existing.progress === 'Pending') {
        existing.progress = 'In Progress';
      }
    }
    return acc;
  }, [] as any[]);

  return uniqueData;
};