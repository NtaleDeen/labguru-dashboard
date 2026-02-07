import { query } from '../config/database';

export const getUnmatchedTests = async () => {
  const result = await query(
    `SELECT * FROM unmatched_tests 
     WHERE is_resolved = false 
     ORDER BY occurrence_count DESC, last_seen DESC`
  );

  return result.rows;
};

export const resolveUnmatchedTest = async (id: number, userId: number) => {
  await query(
    `UPDATE unmatched_tests 
     SET is_resolved = true, 
         resolved_at = CURRENT_TIMESTAMP, 
         resolved_by = $1 
     WHERE id = $2`,
    [userId, id]
  );

  return { message: 'Unmatched test resolved' };
};

export const getDashboardStats = async () => {
  // Total tests
  const testsResult = await query(
    'SELECT COUNT(*) as count FROM test_records WHERE is_cancelled = false'
  );

  // Total users
  const usersResult = await query(
    'SELECT COUNT(*) as count FROM users WHERE is_active = true'
  );

  // Unmatched tests
  const unmatchedResult = await query(
    'SELECT COUNT(*) as count FROM unmatched_tests WHERE is_resolved = false'
  );

  // Recent cancellations
  const cancellationsResult = await query(
    `SELECT COUNT(*) as count FROM test_cancellations 
     WHERE cancelled_at >= NOW() - INTERVAL '7 days'`
  );

  return {
    totalTests: parseInt(testsResult.rows[0].count),
    totalUsers: parseInt(usersResult.rows[0].count),
    unmatchedTests: parseInt(unmatchedResult.rows[0].count),
    recentCancellations: parseInt(cancellationsResult.rows[0].count),
  };
};