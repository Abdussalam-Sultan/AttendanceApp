import jwt from 'jsonwebtoken';
import { User, Branch } from '../models/associations.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Branch, attributes: ['id', 'name', 'location'] }]
    });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

export const isAdmin = async (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).send({ error: 'Access denied. Admin role required.' });
  }
};

export const isManager = async (req, res, next) => {
  if (req.user && (req.user.role === 'Manager' || req.user.role === 'Admin')) {
    next();
  } else {
    res.status(403).send({ error: 'Access denied. Manager or Admin role required.' });
  }
};
