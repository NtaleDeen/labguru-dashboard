import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { AuthRequest, User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
      return;
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    const user: User = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const result = await pool.query(
      'SELECT id, username, role, created_at FROM users WHERE id = $1 AND is_active = true',
      [req.user.id]
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
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred',
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
      return;
    }

    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user!.id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user!.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while changing password',
    });
  }
};