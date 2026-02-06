import { Request, Response } from 'express';
import { DataService } from '../services/DataService';
import { ApiResponse } from '../types';
import pool from '../config/database';

export class RevenueController {
  static async getRevenueData(req: Request, res: Response) {
    try {
      const {
        start_date,
        end_date,
        labSection,
        shift,
        hospitalUnit,
        searchQuery,
        page = 1,
        limit = 50
      } = req.query;

      const result = await DataService.getRevenueData({
        startDate: start_date as string,
        endDate: end_date as string,
        labSection: labSection as string,
        shift: shift as string,
        hospitalUnit: hospitalUnit as string,
        searchQuery: searchQuery as string,
        page: Number(page),
        limit: Number(limit)
      });

      const response: ApiResponse = {
        success: true,
        data: result.data,
        total: result.totalRecords,
        page: result.page,
        totalPages: result.totalPages
      };

      res.json(response);
    } catch (error) {
      console.error('Get revenue data error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getRevenueAggregations(req: Request, res: Response) {
    try {
      const {
        start_date,
        end_date,
        labSection,
        shift,
        hospitalUnit
      } = req.query;

      const result = await DataService.getRevenueAggregations({
        startDate: start_date as string,
        endDate: end_date as string,
        labSection: labSection as string,
        shift: shift as string,
        hospitalUnit: hospitalUnit as string
      });

      const response: ApiResponse = {
        success: true,
        data: result
      };

      res.json(response);
    } catch (error) {
      console.error('Get revenue aggregations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getRevenueKPIs(req: Request, res: Response) {
    try {
      const {
        start_date,
        end_date,
        labSection,
        shift,
        hospitalUnit
      } = req.query;

      const conditions: string[] = ['1 = 1'];
      const values: any[] = [];

      if (start_date) {
        conditions.push(`date >= $${values.length + 1}`);
        values.push(start_date);
      }

      if (end_date) {
        conditions.push(`date <= $${values.length + 1}`);
        values.push(end_date);
      }

      if (labSection && labSection !== 'all') {
        conditions.push(`lab_section = $${values.length + 1}`);
        values.push(labSection);
      }

      if (shift && shift !== 'all') {
        conditions.push(`shift = $${values.length + 1}`);
        values.push(shift);
      }

      if (hospitalUnit && hospitalUnit !== 'all') {
        if (hospitalUnit === 'mainLab') {
          conditions.push(`hospital_unit IN ('APU', 'GWA', 'GWB', 'HDU', 'ICU', 'MAT', 'NICU', 'THEATRE', '2ND FLOOR', 'A&E', 'DIALYSIS', 'DOCTORS PLAZA', 'ENT', 'RADIOLOGY', 'SELF REQUEST', 'WELLNESS', 'WELLNESS CENTER')`);
        } else if (hospitalUnit === 'annex') {
          conditions.push(`hospital_unit = 'ANNEX'`);
        } else {
          conditions.push(`hospital_unit = $${values.length + 1}`);
          values.push(hospitalUnit);
        }
      }

      const whereClause = conditions.join(' AND ');

      // Total Revenue
      const totalRevenueQuery = `
        SELECT COALESCE(SUM(price), 0) as total_revenue
        FROM revenue_data 
        WHERE ${whereClause}
      `;

      // Test Count
      const testCountQuery = `
        SELECT COUNT(*) as test_count
        FROM revenue_data 
        WHERE ${whereClause}
      `;

      // Unique Days
      const daysQuery = `
        SELECT COUNT(DISTINCT date) as day_count
        FROM revenue_data 
        WHERE ${whereClause}
      `;

      // Previous Period (for comparison)
      let prevStartDate, prevEndDate;
      if (start_date && end_date) {
        const start = new Date(start_date as string);
        const end = new Date(end_date as string);
        const periodDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        prevEndDate = new Date(start);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - periodDays + 1);
      }

      const prevConditions = [...conditions];
      const prevValues = [...values];

      if (prevStartDate && prevEndDate) {
        // Replace date conditions for previous period
        const dateIndex = conditions.findIndex(c => c.includes('date >='));
        if (dateIndex !== -1) {
          prevConditions[dateIndex] = `date >= $${prevValues.length + 1}`;
          prevValues.push(prevStartDate.toISOString().split('T')[0]);
        }

        const endDateIndex = conditions.findIndex(c => c.includes('date <='));
        if (endDateIndex !== -1) {
          prevConditions[endDateIndex] = `date <= $${prevValues.length + 1}`;
          prevValues.push(prevEndDate.toISOString().split('T')[0]);
        }
      }

      const prevWhereClause = prevConditions.join(' AND ');
      const prevRevenueQuery = `
        SELECT COALESCE(SUM(price), 0) as total_revenue
        FROM revenue_data 
        WHERE ${prevWhereClause}
      `;

      const [totalRevenueResult, testCountResult, daysResult, prevRevenueResult] = await Promise.all([
        pool.query(totalRevenueQuery, values),
        pool.query(testCountQuery, values),
        pool.query(daysQuery, values),
        pool.query(prevRevenueQuery, prevValues)
      ]);

      const totalRevenue = parseFloat(totalRevenueResult.rows[0].total_revenue);
      const testCount = parseInt(testCountResult.rows[0].test_count);
      const dayCount = parseInt(daysResult.rows[0].day_count) || 1;
      const prevTotalRevenue = parseFloat(prevRevenueResult.rows[0].total_revenue);

      const avgDailyRevenue = totalRevenue / dayCount;
      const avgDailyTests = testCount / dayCount;
      const revenueGrowthRate = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;

      const kpis = {
        totalRevenue,
        testCount,
        dayCount,
        avgDailyRevenue,
        avgDailyTests,
        revenueGrowthRate,
        prevTotalRevenue
      };

      const response: ApiResponse = {
        success: true,
        data: kpis
      };

      res.json(response);
    } catch (error) {
      console.error('Get revenue KPIs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getMonthlyTarget(req: Request, res: Response) {
    try {
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({ error: 'Year and month are required' });
      }

      const result = await pool.query(
        'SELECT target_amount FROM monthly_targets WHERE year = $1 AND month = $2',
        [parseInt(year as string), parseInt(month as string)]
      );

      const target = result.rows.length > 0 ? parseFloat(result.rows[0].target_amount) : 1500000000;

      const response: ApiResponse = {
        success: true,
        data: { target }
      };

      res.json(response);
    } catch (error) {
      console.error('Get monthly target error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async setMonthlyTarget(req: Request, res: Response) {
    try {
      const { year, month, target_amount } = req.body;

      if (!year || !month || !target_amount) {
        return res.status(400).json({ error: 'Year, month, and target amount are required' });
      }

      const result = await pool.query(
        `INSERT INTO monthly_targets (year, month, target_amount)
         VALUES ($1, $2, $3)
         ON CONFLICT (year, month) DO UPDATE 
         SET target_amount = EXCLUDED.target_amount`,
        [parseInt(year), parseInt(month), parseFloat(target_amount)]
      );

      const response: ApiResponse = {
        success: true,
        message: 'Monthly target updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Set monthly target error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}