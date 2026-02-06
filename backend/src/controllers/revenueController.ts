import { Request, Response } from 'express';
import pool from '../config/database';
import { 
  RevenueFilters, 
  DailyRevenue, 
  SectionRevenue, 
  TestRevenue,
  DashboardStats 
} from '../types';
import { calculatePercentageChange } from '../utils/dateUtils';

export const getDailyRevenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: RevenueFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      labSection: req.query.labSection as string,
    };

    let query = `
      SELECT 
        encounter_date as date,
        SUM(price) as total_revenue,
        COUNT(*) as test_count
      FROM test_records
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.startDate) {
      query += ` AND encounter_date >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND encounter_date <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    if (filters.labSection) {
      query += ` AND lab_section = $${paramIndex++}`;
      params.push(filters.labSection);
    }

    query += `
      GROUP BY encounter_date
      ORDER BY encounter_date ASC
    `;

    const result = await pool.query(query, params);

    const data: DailyRevenue[] = result.rows.map(row => ({
      date: row.date,
      total_revenue: parseFloat(row.total_revenue) || 0,
      test_count: parseInt(row.test_count) || 0,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get daily revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily revenue',
    });
  }
};

export const getSectionRevenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: RevenueFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    let query = `
      SELECT 
        lab_section,
        SUM(price) as total_revenue,
        COUNT(*) as test_count
      FROM test_records
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.startDate) {
      query += ` AND encounter_date >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND encounter_date <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    query += `
      GROUP BY lab_section
      ORDER BY total_revenue DESC
    `;

    const result = await pool.query(query, params);

    const data: SectionRevenue[] = result.rows.map(row => ({
      lab_section: row.lab_section,
      total_revenue: parseFloat(row.total_revenue) || 0,
      test_count: parseInt(row.test_count) || 0,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get section revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch section revenue',
    });
  }
};

export const getTopTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: RevenueFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      labSection: req.query.labSection as string,
    };

    const limit = parseInt(req.query.limit as string) || 50;

    let query = `
      SELECT 
        test_name,
        lab_section,
        price,
        COUNT(*) as test_count,
        SUM(price) as total_revenue
      FROM test_records
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.startDate) {
      query += ` AND encounter_date >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND encounter_date <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    if (filters.labSection) {
      query += ` AND lab_section = $${paramIndex++}`;
      params.push(filters.labSection);
    }

    query += `
      GROUP BY test_name, lab_section, price
      ORDER BY total_revenue DESC
      LIMIT $${paramIndex}
    `;
    params.push(limit);

    const result = await pool.query(query, params);

    const data: TestRevenue[] = result.rows.map(row => ({
      test_name: row.test_name,
      lab_section: row.lab_section,
      price: parseFloat(row.price) || 0,
      test_count: parseInt(row.test_count) || 0,
      total_revenue: parseFloat(row.total_revenue) || 0,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get top tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top tests',
    });
  }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters: RevenueFilters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    // Current period stats
    let query = `
      SELECT 
        SUM(price) as total_revenue,
        COUNT(*) as total_tests,
        AVG(price) as average_price
      FROM test_records
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.startDate) {
      query += ` AND encounter_date >= $${paramIndex++}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ` AND encounter_date <= $${paramIndex++}`;
      params.push(filters.endDate);
    }

    const currentResult = await pool.query(query, params);
    const current = currentResult.rows[0];

    // Top section
    const topSectionQuery = `
      SELECT lab_section, SUM(price) as revenue
      FROM test_records
      WHERE 1=1
      ${filters.startDate ? `AND encounter_date >= $1` : ''}
      ${filters.endDate ? `AND encounter_date <= $${filters.startDate ? 2 : 1}` : ''}
      GROUP BY lab_section
      ORDER BY revenue DESC
      LIMIT 1
    `;

    const topSectionResult = await pool.query(topSectionQuery, params.slice(0, 2));
    const topSection = topSectionResult.rows[0]?.lab_section || 'N/A';

    // Previous period for comparison
    let previousRevenue = 0;
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const duration = end.getTime() - start.getTime();
      
      const prevStart = new Date(start.getTime() - duration);
      const prevEnd = start;

      const prevQuery = `
        SELECT SUM(price) as total_revenue
        FROM test_records
        WHERE encounter_date >= $1 AND encounter_date < $2
      `;

      const prevResult = await pool.query(prevQuery, [
        prevStart.toISOString().split('T')[0],
        prevEnd.toISOString().split('T')[0],
      ]);

      previousRevenue = parseFloat(prevResult.rows[0]?.total_revenue) || 0;
    }

    const currentRevenue = parseFloat(current.total_revenue) || 0;
    const percentageChange = calculatePercentageChange(previousRevenue, currentRevenue);

    const stats: DashboardStats = {
      totalRevenue: currentRevenue,
      totalTests: parseInt(current.total_tests) || 0,
      averagePrice: parseFloat(current.average_price) || 0,
      topSection,
      periodComparison: {
        current: currentRevenue,
        previous: previousRevenue,
        percentageChange,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
    });
  }
};

export const getMonthlyRevenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const labSection = req.query.labSection as string;

    let query = `
      SELECT 
        EXTRACT(MONTH FROM encounter_date) as month,
        SUM(price) as total_revenue,
        COUNT(*) as test_count
      FROM test_records
      WHERE EXTRACT(YEAR FROM encounter_date) = $1
    `;

    const params: any[] = [year];
    let paramIndex = 2;

    if (labSection) {
      query += ` AND lab_section = $${paramIndex++}`;
      params.push(labSection);
    }

    query += `
      GROUP BY EXTRACT(MONTH FROM encounter_date)
      ORDER BY month ASC
    `;

    const result = await pool.query(query, params);

    const data = result.rows.map(row => ({
      month: parseInt(row.month),
      total_revenue: parseFloat(row.total_revenue) || 0,
      test_count: parseInt(row.test_count) || 0,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get monthly revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly revenue',
    });
  }
};

export const getQuarterlyRevenue = async (req: Request, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const labSection = req.query.labSection as string;

    let query = `
      SELECT 
        EXTRACT(QUARTER FROM encounter_date) as quarter,
        SUM(price) as total_revenue,
        COUNT(*) as test_count
      FROM test_records
      WHERE EXTRACT(YEAR FROM encounter_date) = $1
    `;

    const params: any[] = [year];
    let paramIndex = 2;

    if (labSection) {
      query += ` AND lab_section = $${paramIndex++}`;
      params.push(labSection);
    }

    query += `
      GROUP BY EXTRACT(QUARTER FROM encounter_date)
      ORDER BY quarter ASC
    `;

    const result = await pool.query(query, params);

    const data = result.rows.map(row => ({
      quarter: parseInt(row.quarter),
      total_revenue: parseFloat(row.total_revenue) || 0,
      test_count: parseInt(row.test_count) || 0,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Get quarterly revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quarterly revenue',
    });
  }
};