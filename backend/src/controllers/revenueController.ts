import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as revenueService from '../services/revenueService';

export const getRevenueController = async (req: AuthRequest, res: Response) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      period: req.query.period as string,
      labSection: req.query.labSection as string,
      shift: req.query.shift as string,
      laboratory: req.query.laboratory as string,
    };

    const data = await revenueService.getRevenueData(filters);
    res.json(data);
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
};

export const getLabSectionsController = async (req: AuthRequest, res: Response) => {
  try {
    const sections = await revenueService.getAvailableLabSections();
    res.json(sections);
  } catch (error) {
    console.error('Get lab sections error:', error);
    res.status(500).json({ error: 'Failed to fetch lab sections' });
  }
};