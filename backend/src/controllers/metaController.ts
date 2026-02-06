import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { search, section } = req.query;
    
    let query = 'SELECT * FROM test_metadata WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (search) {
      query += ` AND test_name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (section) {
      query += ` AND section = $${paramCount}`;
      params.push(section);
      paramCount++;
    }

    query += ' ORDER BY test_name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get metadata error:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
};

export const createMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { test_name, tat, section, price } = req.body;

    // Check if test already exists
    const existing = await pool.query(
      'SELECT id FROM test_metadata WHERE test_name = $1',
      [test_name]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Test already exists' });
    }

    const result = await pool.query(
      'INSERT INTO test_metadata (test_name, tat, section, price) VALUES ($1, $2, $3, $4) RETURNING *',
      [test_name, tat, section, price]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create metadata error:', error);
    res.status(500).json({ error: 'Failed to create metadata' });
  }
};

export const updateMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { test_name, tat, section, price } = req.body;

    const result = await pool.query(
      'UPDATE test_metadata SET tat = $1, section = $2, price = $3, last_updated = CURRENT_TIMESTAMP WHERE test_name = $4 RETURNING *',
      [tat, section, price, test_name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update metadata error:', error);
    res.status(500).json({ error: 'Failed to update metadata' });
  }
};

export const deleteMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { test_name } = req.query;

    await pool.query('DELETE FROM test_metadata WHERE test_name = $1', [test_name]);
    res.json({ message: 'Metadata deleted successfully' });
  } catch (error) {
    console.error('Delete metadata error:', error);
    res.status(500).json({ error: 'Failed to delete metadata' });
  }
};

export const getUnmatchedTests = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM unmatched_tests ORDER BY count DESC, last_seen DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get unmatched tests error:', error);
    res.status(500).json({ error: 'Failed to fetch unmatched tests' });
  }
};

export const getSections = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT section FROM test_metadata ORDER BY section ASC'
    );
    res.json(result.rows.map(row => row.section));
  } catch (error) {
    console.error('Get sections error:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
};