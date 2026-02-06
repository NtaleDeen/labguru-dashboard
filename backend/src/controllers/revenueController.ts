import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getRevenueData = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, section, shift, unit } = req.query;
    
    let query = 'SELECT * FROM revenue_data WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (section && section !== 'all') {
      query += ` AND section = $${paramCount}`;
      params.push(section);
      paramCount++;
    }

    if (shift && shift !== 'all') {
      query += ` AND shift = $${paramCount}`;
      params.push(shift);
      paramCount++;
    }

    if (unit && unit !== 'all') {
      query += ` AND unit = $${paramCount}`;
      params.push(unit);
      paramCount++;
    }

    query += ' ORDER BY date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get revenue data error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
};

export const getRevenueSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, section, shift, unit } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (startDate) {
      whereClause += ` AND date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      whereClause += ` AND date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (section && section !== 'all') {
      whereClause += ` AND section = $${paramCount}`;
      params.push(section);
      paramCount++;
    }

    if (shift && shift !== 'all') {
      whereClause += ` AND shift = $${paramCount}`;
      params.push(shift);
      paramCount++;
    }

    if (unit && unit !== 'all') {
      whereClause += ` AND unit = $${paramCount}`;
      params.push(unit);
      paramCount++;
    }

    const summaryQuery = `
      SELECT 
        SUM(price) as total_revenue,
        COUNT(*) as total_tests,
        COUNT(DISTINCT date) as days_active,
        AVG(price) as avg_test_price
      FROM revenue_data ${whereClause}
    `;

    const sectionQuery = `
      SELECT 
        section,
        SUM(price) as revenue,
        COUNT(*) as test_count
      FROM revenue_data ${whereClause}
      GROUP BY section
      ORDER BY revenue DESC
    `;

    const dailyQuery = `
      SELECT 
        date,
        SUM(price) as revenue,
        COUNT(*) as test_count
      FROM revenue_data ${whereClause}
      GROUP BY date
      ORDER BY date ASC
    `;

    const topTestsQuery = `
      SELECT 
        test_name,
        SUM(price) as revenue,
        COUNT(*) as test_count
      FROM revenue_data ${whereClause}
      GROUP BY test_name
      ORDER BY revenue DESC
      LIMIT 50
    `;

    const [summary, bySection, daily, topTests] = await Promise.all([
      pool.query(summaryQuery, params),
      pool.query(sectionQuery, params),
      pool.query(dailyQuery, params),
      pool.query(topTestsQuery, params),
    ]);

    res.json({
      summary: summary.rows[0],
      bySection: bySection.rows,
      daily: daily.rows,
      topTests: topTests.rows,
    });
  } catch (error) {
    console.error('Get revenue summary error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue summary' });
  }
};