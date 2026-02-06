import pool from '../config/database';
import { FilterParams } from '../types';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parse/sync';

export class DataService {
  // Revenue Data Methods
  static async getRevenueData(params: FilterParams) {
    const {
      startDate,
      endDate,
      labSection,
      shift,
      hospitalUnit,
      searchQuery,
      page = 1,
      limit = 50
    } = params;

    const offset = (page - 1) * limit;
    const conditions: string[] = ['1 = 1'];
    const values: any[] = [];

    if (startDate) {
      conditions.push(`date >= $${values.length + 1}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`date <= $${values.length + 1}`);
      values.push(endDate);
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

    if (searchQuery) {
      conditions.push(`(lab_number ILIKE $${values.length + 1} OR test_name ILIKE $${values.length + 1})`);
      values.push(`%${searchQuery}%`);
    }

    const whereClause = conditions.join(' AND ');
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM revenue_data WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const totalRecords = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalRecords / limit);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM revenue_data 
      WHERE ${whereClause}
      ORDER BY date DESC, lab_number
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    const dataValues = [...values, limit, offset];
    const dataResult = await pool.query(dataQuery, dataValues);

    return {
      data: dataResult.rows,
      totalRecords,
      totalPages,
      page,
      limit
    };
  }

  // Revenue Aggregations for Charts
  static async getRevenueAggregations(params: FilterParams) {
    const {
      startDate,
      endDate,
      labSection,
      shift,
      hospitalUnit
    } = params;

    const conditions: string[] = ['1 = 1'];
    const values: any[] = [];

    if (startDate) {
      conditions.push(`date >= $${values.length + 1}`);
      values.push(startDate);
    }

    if (endDate) {
      conditions.push(`date <= $${values.length + 1}`);
      values.push(endDate);
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

    // Daily Revenue
    const dailyQuery = `
      SELECT 
        date,
        SUM(price) as total_revenue,
        COUNT(*) as test_count
      FROM revenue_data 
      WHERE ${whereClause}
      GROUP BY date 
      ORDER BY date
    `;

    // Revenue by Lab Section
    const sectionQuery = `
      SELECT 
        lab_section,
        SUM(price) as total_revenue,
        COUNT(*) as test_count
      FROM revenue_data 
      WHERE ${whereClause}
      GROUP BY lab_section 
      ORDER BY total_revenue DESC
    `;

    // Revenue by Hospital Unit
    const unitQuery = `
      SELECT 
        hospital_unit,
        SUM(price) as total_revenue,
        COUNT(*) as test_count
      FROM revenue_data 
      WHERE ${whereClause}
      GROUP BY hospital_unit 
      ORDER BY total_revenue DESC
    `;

    // Top Tests by Revenue
    const testsQuery = `
      SELECT 
        test_name,
        SUM(price) as total_revenue,
        COUNT(*) as test_count
      FROM revenue_data 
      WHERE ${whereClause}
      GROUP BY test_name 
      ORDER BY total_revenue DESC
      LIMIT 50
    `;

    const [dailyResult, sectionResult, unitResult, testsResult] = await Promise.all([
      pool.query(dailyQuery, values),
      pool.query(sectionQuery, values),
      pool.query(unitQuery, values),
      pool.query(testsQuery, values)
    ]);

    return {
      dailyRevenue: dailyResult.rows,
      bySection: sectionResult.rows,
      byUnit: unitResult.rows,
      byTest: testsResult.rows
    };
  }

  // Test Metadata Methods
  static async getTestMetadata(params: FilterParams) {
    const {
      labSection,
      searchQuery,
      page = 1,
      limit = 50
    } = params;

    const offset = (page - 1) * limit;
    const conditions: string[] = ['is_active = true'];
    const values: any[] = [];

    if (labSection && labSection !== 'all') {
      conditions.push(`lab_section = $${values.length + 1}`);
      values.push(labSection);
    }

    if (searchQuery) {
      conditions.push(`test_name ILIKE $${values.length + 1}`);
      values.push(`%${searchQuery}%`);
    }

    const whereClause = conditions.join(' AND ');
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM test_metadata WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const totalRecords = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalRecords / limit);

    // Get paginated data
    const dataQuery = `
      SELECT 
        tm.*,
        ls.description as section_description
      FROM test_metadata tm
      LEFT JOIN lab_sections ls ON tm.lab_section = ls.section_name
      WHERE ${whereClause}
      ORDER BY test_name
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    
    const dataValues = [...values, limit, offset];
    const dataResult = await pool.query(dataQuery, dataValues);

    return {
      data: dataResult.rows,
      totalRecords,
      totalPages,
      page,
      limit
    };
  }

  // Lab Sections Methods
  static async getLabSections() {
    const result = await pool.query(`
      SELECT 
        ls.*,
        COUNT(tm.id) as test_count
      FROM lab_sections ls
      LEFT JOIN test_metadata tm ON ls.section_name = tm.lab_section AND tm.is_active = true
      GROUP BY ls.id
      ORDER BY ls.section_name
    `);

    return result.rows;
  }

  // Unmatched Tests Methods
  static async getUnmatchedTests() {
    const result = await pool.query(`
      SELECT * FROM unmatched_tests 
      WHERE status = 'pending'
      ORDER BY occurrences DESC, last_seen DESC
    `);

    return result.rows;
  }

  // Import data from data.json (for initial setup)
  static async importFromJson() {
    const dataPath = path.join(__dirname, '../../../frontend/public/data.json');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error('data.json not found');
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const records = JSON.parse(rawData);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Clear existing revenue data
      await client.query('DELETE FROM revenue_data');

      // Process and insert records
      for (const record of records) {
        // Parse lab number timestamp
        const labNo = record.LabNo;
        let date = new Date();
        let shift = 'Day Shift';
        
        if (labNo && labNo.length >= 10) {
          const day = parseInt(labNo.substring(0, 2));
          const month = parseInt(labNo.substring(2, 4));
          const year = parseInt(labNo.substring(4, 6)) + 2000;
          const hour = parseInt(labNo.substring(6, 8));
          
          date = new Date(year, month - 1, day);
          
          // Determine shift
          if (hour >= 8 && hour <= 19) {
            shift = 'Day Shift';
          } else {
            shift = 'Night Shift';
          }
        }

        // Check if test exists in metadata
        const testCheck = await client.query(
          'SELECT id FROM test_metadata WHERE test_name = $1 AND is_active = true',
          [record.TestName]
        );

        if (testCheck.rows.length === 0) {
          // Record as unmatched test
          await client.query(
            `INSERT INTO unmatched_tests (test_name, occurrences, last_seen)
             VALUES ($1, 1, CURRENT_TIMESTAMP)
             ON CONFLICT (test_name) DO UPDATE 
             SET occurrences = unmatched_tests.occurrences + 1, last_seen = CURRENT_TIMESTAMP`,
            [record.TestName]
          );
          continue; // Skip this record
        }

        // Insert revenue data
        await client.query(
          `INSERT INTO revenue_data 
           (lab_number, invoice_no, test_name, date, lab_section, shift, hospital_unit, price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 
            (SELECT price FROM test_metadata WHERE test_name = $3 AND is_active = true))`,
          [
            labNo,
            record.InvoiceNo,
            record.TestName,
            date,
            record.TestName.split(' ')[0], // Simple extraction - should be improved
            shift,
            record.Src || 'Unknown'
          ]
        );
      }

      await client.query('COMMIT');
      console.log(`✅ Imported ${records.length} records from data.json`);
      
      return {
        imported: records.length,
        unmatched: await this.getUnmatchedTestsCount()
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to import data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getUnmatchedTestsCount() {
    const result = await pool.query(
      'SELECT COUNT(*) FROM unmatched_tests WHERE status = "pending"'
    );
    return parseInt(result.rows[0].count);
  }

  // Get LRIDS data (real-time progress)
  static async getLRIDSData(limit = 100) {
    const result = await pool.query(`
      SELECT 
        rd.lab_number,
        rd.date,
        rd.shift,
        rd.hospital_unit as unit,
        tm.test_name,
        rd.date + INTERVAL '1 minute' * tm.tat as request_time_expected,
        NULL as request_time_out,
        'pending' as progress_status
      FROM revenue_data rd
      JOIN test_metadata tm ON rd.test_name = tm.test_name
      WHERE rd.date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY rd.date DESC, rd.lab_number
      LIMIT $1
    `, [limit]);

    return result.rows;
  }
}