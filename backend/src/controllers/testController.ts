import { Request, Response } from 'express';
import pool from '../config/database';

export const getAllTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lab_section, search } = req.query;

    let query = `
      SELECT id, test_name, lab_section, tat, price, created_at, updated_at 
      FROM tests 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (lab_section) {
      query += ` AND lab_section = $${paramIndex++}`;
      params.push(lab_section);
    }

    if (search) {
      query += ` AND test_name ILIKE $${paramIndex++}`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY test_name ASC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get all tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tests',
    });
  }
};

export const getTestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM tests WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Test not found',
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get test by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test',
    });
  }
};

export const createTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { test_name, lab_section, tat, price } = req.body;

    if (!test_name || !lab_section || !tat || !price) {
      res.status(400).json({
        success: false,
        message: 'Test name, lab section, TAT, and price are required',
      });
      return;
    }

    // Generate ID from test name (simple slug)
    const id = test_name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    // Check if test already exists
    const existing = await pool.query('SELECT id FROM tests WHERE id = $1', [id]);
    
    if (existing.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Test with this name already exists',
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO tests (id, test_name, lab_section, tat, price) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [id, test_name, lab_section, tat, price]
    );

    res.status(201).json({
      success: true,
      message: 'Test created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test',
    });
  }
};

export const updateTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { test_name, lab_section, tat, price } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (test_name !== undefined) {
      updates.push(`test_name = $${paramIndex++}`);
      values.push(test_name);
    }

    if (lab_section !== undefined) {
      updates.push(`lab_section = $${paramIndex++}`);
      values.push(lab_section);
    }

    if (tat !== undefined) {
      updates.push(`tat = $${paramIndex++}`);
      values.push(tat);
    }

    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
      return;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE tests 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Test not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Test updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update test',
    });
  }
};

export const deleteTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM tests WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Test not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Test deleted successfully',
    });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete test',
    });
  }
};

export const getLabSections = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT lab_section 
       FROM tests 
       WHERE lab_section IS NOT NULL 
       ORDER BY lab_section ASC`
    );

    res.json({
      success: true,
      data: result.rows.map(row => row.lab_section),
    });
  } catch (error) {
    console.error('Get lab sections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab sections',
    });
  }
};

export const bulkImportTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tests } = req.body;

    if (!Array.isArray(tests) || tests.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Tests array is required and cannot be empty',
      });
      return;
    }

    const client = await pool.connect();
    let imported = 0;
    let skipped = 0;

    try {
      await client.query('BEGIN');

      for (const test of tests) {
        const { test_name, lab_section, tat, price } = test;

        if (!test_name || !lab_section || tat === undefined || price === undefined) {
          skipped++;
          continue;
        }

        const id = test_name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

        // Upsert: insert or update if exists
        await client.query(
          `INSERT INTO tests (id, test_name, lab_section, tat, price)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE 
           SET test_name = $2, lab_section = $3, tat = $4, price = $5, updated_at = CURRENT_TIMESTAMP`,
          [id, test_name, lab_section, tat, price]
        );

        imported++;
      }

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Successfully imported ${imported} tests, skipped ${skipped}`,
        data: { imported, skipped },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Bulk import tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import tests',
    });
  }
};