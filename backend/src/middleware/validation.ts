import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const userValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('role')
    .isIn(['admin', 'manager', 'technician', 'viewer'])
    .withMessage('Invalid role'),
];

export const metadataValidation = [
  body('test_name').trim().notEmpty().withMessage('Test name is required'),
  body('tat').isInt({ min: 0 }).withMessage('TAT must be a positive integer'),
  body('section').trim().notEmpty().withMessage('Section is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
];