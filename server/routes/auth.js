import express from 'express';
import { User, Branch, LoginHistory, Department, Company } from '../models/associations.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import SystemSettings from '../models/SystemSettings.js';
import { sendEmail, emailTemplates } from '../services/emailService.js';

const router = express.Router();

// Public route to fetch branches for a specific company (needed for registration)
router.get('/branches', async (req, res) => {
  try {
    const { companyId } = req.query;
    const branches = await Branch.findAll({
      where: companyId ? { companyId } : {},
      attributes: ['id', 'name']
    });
    res.send(branches);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branchId, deviceId, companyId } = req.body;
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).send({ error: 'Email already registered' });
    }

    if (!companyId) {
      return res.status(400).send({ error: 'Company ID is required for registration.' });
    }

    if (!branchId) {
      return res.status(400).send({ error: 'Branch assignment is mandatory during registration.' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: 'Staff', 
      branchId,
      companyId,
      deviceId,
      verificationToken,
      isEmailVerified: false,
      employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}` 
    });

    // Send verification email
    if (user.email) {
      const template = emailTemplates.verification(user, verificationToken);
      sendEmail({
        to: user.email,
        ...template
      }).catch(err => console.error('Error sending verification email:', err));
    }

    res.status(201).send({ 
      message: 'Registration successful. Please check your email to verify your account.',
      email: user.email
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(400).send({ 
       error: 'Registration failed', 
       details: error.message || 'Internal Server Error' 
    });
  }
});

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send({ error: 'Token is required' });

    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) return res.status(400).send({ error: 'Invalid or expired verification token' });

    await user.update({
      isEmailVerified: true,
      verificationToken: null
    });

    // Send welcome email now that they are verified
    const template = emailTemplates.welcome(user);
    sendEmail({
      to: user.email,
      ...template
    }).catch(err => console.error('Error sending welcome email after verification:', err));

    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #4f46e5;">Email Verified!</h1>
        <p>Thank you for verifying your email. You can now log in to the DoorLog app.</p>
        <a href="${process.env.APP_URL || '#'}" style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; margin-top: 20px;">Return to App</a>
      </div>
    `);
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email, isEmailVerified: false } });
    
    if (!user) {
      return res.status(400).send({ error: 'User not found or already verified.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await user.update({ verificationToken });

    const template = emailTemplates.verification(user, verificationToken);
    await sendEmail({
      to: user.email,
      ...template
    });

    res.send({ message: 'Verification email resent successfully.' });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.send({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    await user.update({
      resetPasswordToken: token,
      resetPasswordExpires: Date.now() + 3600000 // 1 hour
    });

    const template = emailTemplates.passwordReset(user, token);
    await sendEmail({
      to: user.email,
      ...template
    });

    res.send({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post('/reset-password-confirm', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ 
      where: { 
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      } 
    });

    if (!user) {
      return res.status(400).send({ error: 'Password reset token is invalid or has expired.' });
    }

    user.password = password; // Hook will hash it
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Notify of success
    const template = emailTemplates.passwordChange(user);
    sendEmail({
      to: user.email,
      ...template
    }).catch(() => {});

    res.send({ message: 'Password has been reset successfully.' });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.get('/reset-password', (req, res) => {
  const { token } = req.query;
  res.send(`
    <div style="font-family: sans-serif; max-width: 400px; margin: 50px auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; text-align: center;">
      <h1 style="color: #4f46e5; margin-bottom: 24px;">Reset Password</h1>
      <form action="/api/auth/reset-password-confirm" method="POST" id="resetForm">
        <input type="hidden" name="token" value="${token}">
        <input type="password" name="password" placeholder="New Password" required style="width: 100%; padding: 12px; margin-bottom: 16px; border: 1px solid #cbd5e1; border-radius: 8px;">
        <button type="submit" style="width: 100%; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Update Password</button>
      </form>
      <script>
        document.getElementById('resetForm').onsubmit = async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const res = await fetch('/api/auth/reset-password-confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData))
          });
          const data = await res.json();
          if (res.ok) {
            document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h1 style="color:#10b981;">Success!</h1><p>Your password has been reset. You can now log in.</p></div>';
          } else {
            alert(data.error || 'Reset failed');
          }
        };
      </script>
    </div>
  `);
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    const user = await User.findOne({ 
      where: { email },
      include: [
        { model: Branch, attributes: ['id', 'name', 'location'] },
        { model: Department, attributes: ['id', 'name'] },
        { model: Company, attributes: ['id', 'name', 'status'] }
      ]
    });
    
    if (!user) {
      return res.status(401).send({ error: 'Account not found. Please register first.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).send({ error: 'Invalid password. Please try again.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).send({ 
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before logging in.',
        email: user.email
      });
    }

    const settings = await SystemSettings.findOne();
    const deviceBindingActive = settings?.deviceBindingEnabled === true;
    
    if (deviceBindingActive && user.role !== 'Admin') {
      if (!deviceId) {
        return res.status(400).send({ error: 'Device identity is required for binding.' });
      }

      if (user.deviceId && user.deviceId !== deviceId) {
        return res.status(403).send({ 
          error: 'DEVICE_BOUND', 
          message: 'This account is already linked to another device. Please contact admin to authorize a device change.' 
        });
      }

      if (!user.deviceId) {
        // First time binding
        await user.update({ deviceId });
      }
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
