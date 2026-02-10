import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as settingsService from '../services/settingsService';
import * as testsTargetService from '../services/testsTargetService';
import * as numbersTargetService from '../services/numbersTargetService';

// ============================================================================
// REVENUE TARGET ENDPOINTS
// ============================================================================
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

// ============================================================================
// TESTS TARGET ENDPOINTS
// ============================================================================
export const getTestsTargetController = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const target = await testsTargetService.getTestsTarget(
      parseInt(month as string),
      parseInt(year as string)
    );

    res.json({ target });
  } catch (error) {
    console.error('Get tests target error:', error);
    res.status(500).json({ error: 'Failed to fetch tests target' });
  }
};

export const setTestsTargetController = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, target } = req.body;
    const userId = req.user!.userId;

    if (!month || !year || target === undefined) {
      return res.status(400).json({ error: 'Month, year, and target are required' });
    }

    const result = await testsTargetService.setTestsTarget(
      parseInt(month),
      parseInt(year),
      parseInt(target),
      userId
    );

    res.json(result);
  } catch (error) {
    console.error('Set tests target error:', error);
    res.status(500).json({ error: 'Failed to set tests target' });
  }
};

export const getAllTestsTargetsController = async (req: AuthRequest, res: Response) => {
  try {
    const targets = await testsTargetService.getAllTestsTargets();
    res.json(targets);
  } catch (error) {
    console.error('Get all tests targets error:', error);
    res.status(500).json({ error: 'Failed to fetch tests targets' });
  }
};

// ============================================================================
// NUMBERS TARGET ENDPOINTS
// ============================================================================
export const getNumbersTargetController = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const target = await numbersTargetService.getNumbersTarget(
      parseInt(month as string),
      parseInt(year as string)
    );

    res.json({ target });
  } catch (error) {
    console.error('Get numbers target error:', error);
    res.status(500).json({ error: 'Failed to fetch numbers target' });
  }
};

export const setNumbersTargetController = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, target } = req.body;
    const userId = req.user!.userId;

    if (!month || !year || target === undefined) {
      return res.status(400).json({ error: 'Month, year, and target are required' });
    }

    const result = await numbersTargetService.setNumbersTarget(
      parseInt(month),
      parseInt(year),
      parseInt(target),
      userId
    );

    res.json(result);
  } catch (error) {
    console.error('Set numbers target error:', error);
    res.status(500).json({ error: 'Failed to set numbers target' });
  }
};

export const getAllNumbersTargetsController = async (req: AuthRequest, res: Response) => {
  try {
    const targets = await numbersTargetService.getAllNumbersTargets();
    res.json(targets);
  } catch (error) {
    console.error('Get all numbers targets error:', error);
    res.status(500).json({ error: 'Failed to fetch numbers targets' });
  }
};

// ============================================================================
// GENERAL SETTINGS ENDPOINTS
// ============================================================================
export const getAllSettingsController = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await settingsService.getAllSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};