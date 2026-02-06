import { Request, Response } from 'express';
import pool from '../config/database';
import { ApiResponse, TestMetadata } from '../types';
import { DataService } from '../services/DataService';

export class MetadataController {
  static async getAllMetadata(req: Request, res: Response) {
    try {
      const {
        labSection,
        searchQuery,
        page = 1,
        limit = 50
      } = req.query;

      const result = await DataService.getTestMetadata({
        labSection: labSection as string,
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
      console.error('Get metadata error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createMetadata(req: Request, res: Response) {
    try {
      const { test_name, tat, lab_section, price } = req.body;

      if (!test_name || !tat || !lab_section || !price) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if test exists
      const existingTest = await pool.query(
        'SELECT id FROM test_metadata WHERE test_name = $1',
        [test_name]
      );

      if (existingTest.rows.length > 0) {
        return res.status(400).json({ error: 'Test already exists' });
      }

      // Check if lab section exists
      const sectionExists = await pool.query(
        'SELECT section_name FROM lab_sections WHERE section_name = $1',
        [lab_section]
      );

      if (sectionExists.rows.length === 0) {
        // Create lab section if it doesn't exist
        await pool.query(
          'INSERT INTO lab_sections (section_name) VALUES ($1) ON CONFLICT (section_name) DO NOTHING',
          [lab_section]
        );
      }

      // Create test metadata
      const result = await pool.query(
        `INSERT INTO test_metadata (test_name, tat, lab_section, price, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [test_name, parseInt(tat), lab_section, parseFloat(price), true]
      );

      // Remove from unmatched tests if exists
      await pool.query(
        'UPDATE unmatched_tests SET status = $1 WHERE test_name = $2',
        ['added', test_name]
      );

      const response: ApiResponse = {
        success: true,
        data: result.rows[0],
        message: 'Test metadata created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Create metadata error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateMetadata(req: Request, res: Response) {
    try {
      const testId = parseInt(req.params.id);
      const { test_name, tat, lab_section, price, is_active } = req.body;

      // Check if test exists
      const existingTest = await pool.query(
        'SELECT id FROM test_metadata WHERE id = $1',
        [testId]
      );

      if (existingTest.rows.length === 0) {
        return res.status(404).json({ error: 'Test not found' });
      }

      // Check if new test name conflicts
      if (test_name) {
        const nameConflict = await pool.query(
          'SELECT id FROM test_metadata WHERE test_name = $1 AND id != $2',
          [test_name, testId]
        );

        if (nameConflict.rows.length > 0) {
          return res.status(400).json({ error: 'Test name already exists' });
        }
      }

      // Check if lab section exists
      if (lab_section) {
        const sectionExists = await pool.query(
          'SELECT section_name FROM lab_sections WHERE section_name = $1',
          [lab_section]
        );

        if (sectionExists.rows.length === 0) {
          // Create lab section if it doesn't exist
          await pool.query(
            'INSERT INTO lab_sections (section_name) VALUES ($1) ON CONFLICT (section_name) DO NOTHING',
            [lab_section]
          );
        }
      }

      // Update test metadata
      const result = await pool.query(
        `UPDATE test_metadata 
         SET test_name = COALESCE($1, test_name),
             tat = COALESCE($2, tat),
             lab_section = COALESCE($3, lab_section),
             price = COALESCE($4, price),
             is_active = COALESCE($5, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [test_name, tat ? parseInt(tat) : null, lab_section, price ? parseFloat(price) : null, is_active, testId]
      );

      const response: ApiResponse = {
        success: true,
        data: result.rows[0],
        message: 'Test metadata updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Update metadata error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteMetadata(req: Request, res: Response) {
    try {
      const testId = parseInt(req.params.id);

      // Check if test exists
      const existingTest = await pool.query(
        'SELECT id FROM test_metadata WHERE id = $1',
        [testId]
      );

      if (existingTest.rows.length === 0) {
        return res.status(404).json({ error: 'Test not found' });
      }

      // Soft delete (deactivate)
      await pool.query(
        'UPDATE test_metadata SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [testId]
      );

      const response: ApiResponse = {
        success: true,
        message: 'Test metadata deactivated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Delete metadata error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUnmatchedTests(req: Request, res: Response) {
    try {
      const result = await pool.query(
        `SELECT * FROM unmatched_tests 
         WHERE status = 'pending'
         ORDER BY occurrences DESC, last_seen DESC`
      );

      const response: ApiResponse = {
        success: true,
        data: result.rows
      };

      res.json(response);
    } catch (error) {
      console.error('Get unmatched tests error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async importFromCsv(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const csv = require('csv-parse/sync');
      const fileContent = file.buffer.toString('utf-8');
      const records = csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        for (const record of records) {
          const { TestName, TAT, LabSection, Price } = record;

          if (!TestName || !TAT || !LabSection || !Price) {
            continue;
          }

          // Check if lab section exists
          const sectionExists = await client.query(
            'SELECT section_name FROM lab_sections WHERE section_name = $1',
            [LabSection]
          );

          if (sectionExists.rows.length === 0) {
            await client.query(
              'INSERT INTO lab_sections (section_name) VALUES ($1) ON CONFLICT (section_name) DO NOTHING',
              [LabSection]
            );
          }

          // Insert or update test metadata
          await client.query(
            `INSERT INTO test_metadata (test_name, tat, lab_section, price, is_active)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (test_name) DO UPDATE 
             SET tat = EXCLUDED.tat, lab_section = EXCLUDED.lab_section, price = EXCLUDED.price,
                 updated_at = CURRENT_TIMESTAMP`,
            [TestName, parseInt(TAT), LabSection, parseFloat(Price), true]
          );

          // Remove from unmatched tests if exists
          await client.query(
            'UPDATE unmatched_tests SET status = $1 WHERE test_name = $2',
            ['added', TestName]
          );
        }

        await client.query('COMMIT');

        const response: ApiResponse = {
          success: true,
          message: `Imported ${records.length} test records from CSV`
        };

        res.json(response);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Import CSV error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async exportToCsv(req: Request, res: Response) {
    try {
      const result = await pool.query(
        'SELECT test_name, tat, lab_section, price FROM test_metadata WHERE is_active = true ORDER BY test_name'
      );

      const csvRows = ['TestName,TAT,LabSection,Price'];
      for (const row of result.rows) {
        csvRows.push(`${row.test_name},${row.tat},${row.lab_section},${row.price}`);
      }

      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=meta_export.csv');
      res.send(csvContent);
    } catch (error) {
      console.error('Export CSV error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}