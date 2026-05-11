import express from 'express';
import { Op } from 'sequelize';
import { Company, User, Branch } from '../models/associations.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public route to list companies for registration
router.get('/all-public', async (req, res) => {
  try {
    const companies = await Company.findAll({
      where: { 
        status: 'Active',
        name: { [Op.ne]: null }
      },
      attributes: ['id', 'name']
    });
    res.send(companies.filter(c => c.id && c.name));
  } catch (error) {
    res.status(500).send(error);
  }
});

// Register a new company and its first admin
router.post('/setup', async (req, res) => {
  try {
    const { companyName, adminName, adminEmail, adminPassword } = req.body;

    // 1. Check if admin user already exists
    const existingUser = await User.findOne({ where: { email: adminEmail } });
    if (existingUser) {
      return res.status(400).send({ error: 'Email already registered' });
    }

    // 2. Create Company
    const company = await Company.create({
      name: companyName,
      status: 'Active'
    });

    // 3. Create a Default Branch for the company
    const branch = await Branch.create({
      name: `${companyName} HQ`,
      location: 'Primary Headquarters',
      code: `HQ-${Math.floor(100 + Math.random() * 899)}`,
      companyId: company.id
    });

    // 4. Create Admin User
    const user = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'Admin',
      companyId: company.id,
      branchId: branch.id,
      employeeId: `ADM-${Math.floor(1000 + Math.random() * 8999)}`
    });

    res.status(201).send({
      message: 'Company and Admin account created successfully',
      company: { id: company.id, name: company.name },
      admin: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('Company Setup Error:', error);
    res.status(400).send({ error: 'Setup failed', details: error.message });
  }
});

// Get company details (Authenticated)
router.get('/me', authenticate, async (req, res) => {
  try {
    const company = await Company.findByPk(req.companyId);
    res.send(company);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
