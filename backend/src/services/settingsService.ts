import { query } from '../config/database';

export const getMonthlyTarget = async (month: number, year: number) => {
  const result = await query(
    `SELECT value FROM settings 
     WHERE key = 'monthly_revenue_target' 
     AND month = $1 AND year = $2`,
    [month, year]
  );

  if (result.rows.length === 0) {
    return 1500000000; // Default 1.5B
  }

  return parseFloat(result.rows[0].value);
};

export const setMonthlyTarget = async (
  month: number,
  year: number,
  target: number,
  userId: number
) => {
  await query(
    `INSERT INTO settings (key, value, month, year, updated_by) 
     VALUES ('monthly_revenue_target', $1, $2, $3, $4)
     ON CONFLICT (key, month, year) 
     DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $4`,
    [target.toString(), month, year, userId]
  );

  // Log audit
  await query(
    `INSERT INTO audit_log (user_id, action, table_name, new_values) 
     VALUES ($1, $2, $3, $4)`,
    [userId, 'SET_MONTHLY_TARGET', 'settings', JSON.stringify({ month, year, target })]
  );

  return { month, year, target };
};

export const getAllSettings = async () => {
  const result = await query(
    'SELECT * FROM settings ORDER BY year DESC, month DESC'
  );

  return result.rows;
};