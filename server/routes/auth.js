import express from 'express';
import User from '../models/User.js';
import Branch from '../models/Branch.js';
import LoginHistory from '../models/LoginHistory.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Public route to fetch branches for registration
router.get('/branches', async (req, res) => {
  try {
    const branches = await Branch.findAll({
      attributes: ['id', 'name']
    });
    res.send(branches);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branchId } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).send({ error: 'Email already registered' });
    }

    // Since default is 'Staff', branchId is mandatory
    if (!branchId) {
      return res.status(400).send({ error: 'Branch assignment is mandatory during registration.' });
    }

    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: 'Staff', 
      branchId,
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}` 
    });
    
    // Record registration login
    const userAgent = req.headers['user-agent'] || 'Unknown';
    let device = 'Web Browser';
    if (/mobile/i.test(userAgent)) device = 'Mobile Device';
    if (/tablet/i.test(userAgent)) device = 'Tablet';
    if (/iphone|ipad/i.test(userAgent)) device = 'iOS Device';
    if (/android/i.test(userAgent)) device = 'Android Device';

    await LoginHistory.create({
      userId: user.id,
      device,
      location: 'New Account',
      ip: req.ip || req.connection.remoteAddress,
      userAgent
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret');
    res.status(201).send({ user, token });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(400).send({ 
       error: 'Registration failed', 
       details: error.message || 'Internal Server Error' 
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).send({ error: 'Account not found. Please register first.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send({ error: 'Invalid password. Please try again.' });
    }

    // Record login history
    const userAgent = req.headers['user-agent'] || 'Unknown';
    let device = 'Web Browser';
    if (/mobile/i.test(userAgent)) device = 'Mobile Device';
    if (/tablet/i.test(userAgent)) device = 'Tablet';
    if (/iphone|ipad/i.test(userAgent)) device = 'iOS Device';
    if (/android/i.test(userAgent)) device = 'Android Device';
    if (/macintosh/i.test(userAgent)) device = 'MacBook / Mac';
    if (/windows/i.test(userAgent)) device = 'Windows PC';

    await LoginHistory.create({
      userId: user.id,
      device,
      location: 'Secure Login', // We don't have geo-ip yet, but this is a start
      ip: req.ip || req.connection.remoteAddress,
      userAgent
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret');
    res.send({ user, token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(400).send({ 
      error: 'Login failed', 
      details: error.message || 'Internal Server Error'
    });
  }
});

export default router;
