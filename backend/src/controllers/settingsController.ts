import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as settingsService from '../services/settingsService';

export const getMonthlyTargetController = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;

    const target = await settingsService.getMonthlyTarget(
      parseInt(month as string),
      parseInt(year as string)
    );

    res.json({ target });
  } catch (error) {
    console.error('Get monthly target error:', error);
    res.status(500).json({ error: 'Failed to fetch monthly target' });
  }
};

export const setMonthlyTargetController = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, target } = req.body;
    const userId = req.user!.userId;

    if (!month || !year || !target) {
      return res.status(400).json({ error: 'Month, year, and target are required' });
    }

    const result = await settingsService.setMonthlyTarget(
      parseInt(month),
      parseInt(year),
      parseFloat(target),
      userId
    );

    res.json(result);
  } catch (error) {
    console.error('Set monthly target error:', error);
    res.status(500).json({ error: 'Failed to set monthly target' });
  }
};

export const getAllSettingsController = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await settingsService.getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};