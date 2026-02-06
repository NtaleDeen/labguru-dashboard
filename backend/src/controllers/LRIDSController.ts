import { Request, Response } from 'express';
import { DataService } from '../services/DataService';
import { ApiResponse } from '../types';
import pool from '../config/database';

export class LRIDSController {
  static async getLRIDSData(req: Request, res: Response) {
    try {
      const { limit = 100 } = req.query;

      // Get recent tests with their status
      const result = await pool.query(`
        SELECT 
          rd.lab_number,
          rd.date,
          rd.shift,
          rd.hospital_unit as unit,
          tm.test_name,
          tm.tat,
          rd.date + INTERVAL '1 minute' * tm.tat as request_time_expected,
          CASE 
            WHEN ct.id IS NOT NULL THEN 'cancelled'
            ELSE 'pending'
          END as status,
          ct.reason as cancellation_reason
        FROM revenue_data rd
        JOIN test_metadata tm ON rd.test_name = tm.test_name
        LEFT JOIN cancelled_tests ct ON rd.lab_number = ct.lab_number AND rd.test_name = ct.test_name
        WHERE rd.date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY rd.date DESC, rd.lab_number
        LIMIT $1
      `, [parseInt(limit as string)]);

      // Add progress calculation
      const data = result.rows.map(row => {
        const now = new Date();
        const timeExpected = new Date(row.request_time_expected);
        const timeDiff = timeExpected.getTime() - now.getTime();
        const minutesRemaining = Math.floor(timeDiff / (1000 * 60));

        let progress = 'pending';
        if (row.status === 'cancelled') {
          progress = 'cancelled';
        } else if (minutesRemaining <= 0) {
          progress = 'overdue';
        } else if (minutesRemaining <= 10) {
          progress = 'urgent';
        } else {
          progress = 'pending';
        }

        return {
          ...row,
          progress,
          minutes_remaining: minutesRemaining > 0 ? minutesRemaining : 0
        };
      });

      const response: ApiResponse = {
        success: true,
        data
      };

      res.json(response);
    } catch (error) {
      console.error('Get LRIDS data error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async cancelTest(req: Request, res: Response) {
    try {
      const { lab_number, test_name, reason, refund_amount } = req.body;
      const cancelled_by = (req as any).user.id;

      if (!lab_number || !test_name) {
        return res.status(400).json({ error: 'Lab number and test name are required' });
      }

      // Check if test exists
      const testExists = await pool.query(
        'SELECT id FROM revenue_data WHERE lab_number = $1 AND test_name = $2',
        [lab_number, test_name]
      );

      if (testExists.rows.length === 0) {
        return res.status(404).json({ error: 'Test not found' });
      }

      // Check if already cancelled
      const alreadyCancelled = await pool.query(
        'SELECT id FROM cancelled_tests WHERE lab_number = $1 AND test_name = $2',
        [lab_number, test_name]
      );

      if (alreadyCancelled.rows.length > 0) {
        return res.status(400).json({ error: 'Test already cancelled' });
      }

      // Record cancellation
      await pool.query(
        `INSERT INTO cancelled_tests (lab_number, test_name, reason, cancelled_by, refund_amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [lab_number, test_name, reason, cancelled_by, refund_amount || null]
      );

      const response: ApiResponse = {
        success: true,
        message: 'Test cancelled successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Cancel test error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getCancelledTests(req: Request, res: Response) {
    try {
      const { start_date, end_date, page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = `
        SELECT 
          ct.*,
          u.username as cancelled_by_name,
          rd.price as original_price
        FROM cancelled_tests ct
        JOIN users u ON ct.cancelled_by = u.id
        JOIN revenue_data rd ON ct.lab_number = rd.lab_number AND ct.test_name = rd.test_name
        WHERE 1 = 1
      `;
      const conditions: string[] = [];
      const values: any[] = [];

      if (start_date) {
        conditions.push(`ct.cancelled_at >= $${values.length + 1}`);
        values.push(start_date);
      }

      if (end_date) {
        conditions.push(`ct.cancelled_at <= $${values.length + 1}`);
        values.push(end_date);
      }

      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }

      query += ' ORDER BY ct.cancelled_at DESC';

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM cancelled_tests ct WHERE 1 = 1 ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}`;
      const countResult = await pool.query(countQuery, values);
      const totalRecords = parseInt(countResult.rows[0].count);

      // Get paginated data
      if (limit !== 'all') {
        query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(Number(limit), offset);
      }

      const result = await pool.query(query, values);

      const response: ApiResponse = {
        success: true,
        data: result.rows,
        total: totalRecords,
        page: Number(page),
        totalPages: Math.ceil(totalRecords / Number(limit))
      };

      res.json(response);
    } catch (error) {
      console.error('Get cancelled tests error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}