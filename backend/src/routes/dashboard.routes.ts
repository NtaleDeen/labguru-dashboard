import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

router.use(authenticate);

// Get dashboard statistics (quick overview)
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const queries = {
      todayRevenue: `
        SELECT COALESCE(SUM(price), 0) as revenue, COUNT(*) as tests
        FROM revenue_data 
        WHERE date = $1
      `,
      todayPending: `
        SELECT COUNT(*) as count
        FROM revenue_data rd
        JOIN test_metadata tm ON rd.test_name = tm.test_name
        WHERE rd.date = $1 
          AND (rd.date + INTERVAL '1 minute' * tm.tat) > CURRENT_TIMESTAMP
          AND NOT EXISTS (
            SELECT 1 FROM cancelled_tests ct 
            WHERE ct.lab_number = rd.lab_number AND ct.test_name = rd.test_name
          )
      `,
      todayOverdue: `
        SELECT COUNT(*) as count
        FROM revenue_data rd
        JOIN test_metadata tm ON rd.test_name = tm.test_name
        WHERE rd.date = $1 
          AND (rd.date + INTERVAL '1 minute' * tm.tat) < CURRENT_TIMESTAMP
          AND NOT EXISTS (
            SELECT 1 FROM cancelled_tests ct 
            WHERE ct.lab_number = rd.lab_number AND ct.test_name = rd.test_name
          )
      `,
      unmatchedTests: `
        SELECT COUNT(*) as count
        FROM unmatched_tests 
        WHERE status = 'pending'
      `
    };

    const [revenueResult, pendingResult, overdueResult, unmatchedResult] = await Promise.all([
      pool.query(queries.todayRevenue, [today]),
      pool.query(queries.todayPending, [today]),
      pool.query(queries.todayOverdue, [today]),
      pool.query(queries.unmatchedTests)
    ]);

    const stats = {
      today: {
        revenue: parseFloat(revenueResult.rows[0].revenue),
        tests: parseInt(revenueResult.rows[0].tests),
        pending: parseInt(pendingResult.rows[0].count),
        overdue: parseInt(overdueResult.rows[0].count)
      },
      alerts: {
        unmatchedTests: parseInt(unmatchedResult.rows[0].count)
      }
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        'revenue' as type,
        date,
        COUNT(*) as count,
        SUM(price) as amount
      FROM revenue_data 
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;