import { Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { AuthRequest, UserRole } from '../types';

export const getAllUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT id, username, role, created_at, updated_at, is_active 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      res.status(400).json({
        success: false,
        message: 'Username, password, and role are required',
      });
      return;
    }

    const validRoles: UserRole[] = ['manager', 'technician', 'viewer'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Must be manager, technician, or viewer',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
      return;
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'Username already exists',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, true) 
       RETURNING id, username, role, created_at, is_active`,
      [username, hashedPassword, role]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, role, is_active } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (username !== undefined) {
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      );

      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Username already exists',
        });
        return;
      }

      updates.push(`username = $${paramIndex++}`);
      values.push(username);
    }

    if (role !== undefined) {
      const validRoles: UserRole[] = ['manager', 'technician', 'viewer'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
        return;
      }
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
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
      `UPDATE users 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING id, username, role, is_active, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user && req.user.id.toString() === id) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
      return;
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};

export const resetUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};