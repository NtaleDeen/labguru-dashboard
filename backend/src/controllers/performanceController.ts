import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as performanceService from '../services/performanceService';

export const getPerformanceController = async (req: AuthRequest, res: Response) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      period: req.query.period as string,
      labSection: req.query.labSection as string,
      shift: req.query.shift as string,
      laboratory: req.query.laboratory as string,
    };

    const data = await performanceService.getPerformanceData(filters);
    res.json(data);
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
};