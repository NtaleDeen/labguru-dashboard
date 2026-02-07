import { Request, Response } from 'express';
import * as lridsService from '../services/lridsService';

export const getLRIDSController = async (req: Request, res: Response) => {
  try {
    const data = await lridsService.getLRIDSData();
    res.json(data);
  } catch (error) {
    console.error('Get LRIDS error:', error);
    res.status(500).json({ error: 'Failed to fetch LRIDS data' });
  }
};