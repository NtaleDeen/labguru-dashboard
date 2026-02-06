import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { User, ApiResponse } from '../types';

export class UserController {
  static async getAllUsers(req: Request, res: Response) {
    try {
      const { search, role, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = 'SELECT id, username, role, client_id, is_active, created_at FROM users';
      const conditions: string[] = [];
      const values: any[] = [];

      if (search) {
        conditions.push(`username ILIKE $${values.length + 1}`);
        values.push(`%${search}%`);
      }

      if (role && role !== 'all') {
        conditions.push(`role = $${values.length + 1}`);
        values.push(role);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY username';

      if (limit !== 'all') {
        query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(Number(limit), offset);
      }

      const result = await pool.query(query, values);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM users';
      if (conditions.length > 0) {
        countQuery += ' WHERE ' + conditions.join(' AND ');
      }
      const countResult = await pool.query(countQuery, values.slice(0, values.length - 2));

      const response: ApiResponse = {
        success: true,
        data: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: Number(page),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / Number(limit))
      };

      res.json(response);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createUser(req: Request, res: Response) {
    try {
      const { username, password, role, client_id } = req.body;

      if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
      }

      // Validate role
      const validRoles = ['admin', 'manager', 'technician', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await pool.query(
        `INSERT INTO users (username, password_hash, role, client_id, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, username, role, client_id, is_active, created_at`,
        [username, passwordHash, role, client_id || null, true]
      );

      const response: ApiResponse = {
        success: true,
        data: result.rows[0],
        message: 'User created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { username, role, client_id, is_active } = req.body;

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (existingUser.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Validate role if provided
      if (role) {
        const validRoles = ['admin', 'manager', 'technician', 'viewer'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ error: 'Invalid role' });
        }
      }

      // Update user
      const result = await pool.query(
        `UPDATE users 
         SET username = COALESCE($1, username),
             role = COALESCE($2, role),
             client_id = COALESCE($3, client_id),
             is_active = COALESCE($4, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING id, username, role, client_id, is_active, updated_at`,
        [username, role, client_id, is_active, userId]
      );

      const response: ApiResponse = {
        success: true,
        data: result.rows[0],
        message: 'User updated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const currentUserId = (req as any).user.id;

      // Cannot delete yourself
      if (userId === currentUserId) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE id = $1',
        [userId]
      );

      if (existingUser.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Soft delete (deactivate)
      await pool.query(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );

      const response: ApiResponse = {
        success: true,
        message: 'User deactivated successfully'
      };

      res.json(response);
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);

      const result = await pool.query(
        'SELECT id, username, role, client_id, is_active, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const response: ApiResponse = {
        success: true,
        data: result.rows[0]
      };

      res.json(response);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}