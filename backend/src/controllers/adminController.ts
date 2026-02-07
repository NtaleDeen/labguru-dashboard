import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as adminService from '../services/adminService';

export const getUnmatchedTestsController = async (req: AuthRequest, res: Response) => {
  try {
    const tests = await adminService.getUnmatchedTests();
    res.json(tests);
  } catch (error) {
    console.error('Get unmatched tests error:', error);
    res.status(500).json({ error: 'Failed to fetch unmatched tests' });
  }
};

export const resolveUnmatchedTestController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await adminService.resolveUnmatchedTest(parseInt(id), userId);
    res.json(result);
  } catch (error) {
    console.error('Resolve unmatched test error:', error);
    res.status(500).json({ error: 'Failed to resolve unmatched test' });
  }
};

export const getDashboardStatsController = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};