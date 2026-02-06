import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getReceptionData = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, search, section, shift, unit } = req.query;
    
    let query = 'SELECT * FROM reception WHERE 1=1';
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

    if (search) {
      query += ` AND (lab_number ILIKE $${paramCount} OR test_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (section) {
      query += ` AND lab_section = $${paramCount}`;
      params.push(section);
      paramCount++;
    }

    if (shift) {
      query += ` AND shift = $${paramCount}`;
      params.push(shift);
      paramCount++;
    }

    if (unit) {
      query += ` AND unit = $${paramCount}`;
      params.push(unit);
      paramCount++;
    }

    query += ' ORDER BY date DESC, lab_number DESC LIMIT 500';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get reception data error:', error);
    res.status(500).json({ error: 'Failed to fetch reception data' });
  }
};

export const updateReception = async (req: AuthRequest, res: Response) => {
  try {
    const { lab_number, test_name, action } = req.body;

    let updateQuery = '';
    const params: any[] = [lab_number, test_name];

    switch (action) {
      case 'urgent':
        updateQuery = "UPDATE reception SET urgency = 'urgent' WHERE lab_number = $1 AND test_name = $2";
        break;
      case 'receive':
        updateQuery = "UPDATE reception SET time_received = CURRENT_TIMESTAMP WHERE lab_number = $1 AND test_name = $2";
        break;
      case 'result':
        updateQuery = "UPDATE reception SET test_time_out = CURRENT_TIMESTAMP WHERE lab_number = $1 AND test_name = $2";
        break;
      case 'cancel':
        const { cancel_reason } = req.body;
        updateQuery = "UPDATE reception SET cancelled = true, cancel_reason = $3 WHERE lab_number = $1 AND test_name = $2";
        params.push(cancel_reason);
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    await pool.query(updateQuery, params);
    res.json({ message: 'Reception data updated successfully' });
  } catch (error) {
    console.error('Update reception error:', error);
    res.status(500).json({ error: 'Failed to update reception data' });
  }
};

export const bulkUpdateReception = async (req: AuthRequest, res: Response) => {
  try {
    const { records, action } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const record of records) {
        const { lab_number, test_name } = record;
        
        let updateQuery = '';
        const params: any[] = [lab_number, test_name];

        switch (action) {
          case 'urgent':
            updateQuery = "UPDATE reception SET urgency = 'urgent' WHERE lab_number = $1 AND test_name = $2";
            break;
          case 'receive':
            updateQuery = "UPDATE reception SET time_received = CURRENT_TIMESTAMP WHERE lab_number = $1 AND test_name = $2";
            break;
          case 'result':
            updateQuery = "UPDATE reception SET test_time_out = CURRENT_TIMESTAMP WHERE lab_number = $1 AND test_name = $2";
            break;
        }

        await client.query(updateQuery, params);
      }

      await client.query('COMMIT');
      res.json({ message: `${records.length} records updated successfully` });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Failed to update records' });
  }
};