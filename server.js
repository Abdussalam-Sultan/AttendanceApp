import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './server/config/database.js';
import './server/models/associations.js';
import User from './server/models/User.js';

// Import Routes
import authRoutes from './server/routes/auth.js';
import userRoutes from './server/routes/user.js';
import attendanceRoutes from './server/routes/attendance.js';
import leaveRoutes from './server/routes/leave.js';
import announcementRoutes from './server/routes/announcement.js';
import notificationRoutes from './server/routes/notification.js';
import adminRoutes from './server/routes/admin.js';
import supportRoutes from './server/routes/support.js';
import { startAutomations } from './server/services/automation.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/leave', leaveRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/support', supportRoutes);

  // Database Sync
  try {
    if (sequelize) {
      await sequelize.authenticate();
      console.log('Database connection has been established successfully.');
      await sequelize.sync({ alter: true }); 
      
      // Seed Admin User
      const adminExists = await User.findOne({ where: { role: 'Admin' } });
      if (!adminExists) {
        console.log('No admin found. Seeding default admin account...');
        await User.create({
          name: process.env.DEFAULT_ADMIN_NAME || 'Admin User',
          email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@doorlog.com',
          password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
          role: 'Admin',
          employeeId: 'ADM-001'
        });
        console.log('Default admin seeded successfully.');
      }
    }

    // Start background tasks
    startAutomations();

  } catch (error) {
    console.error('Unable to connect to the database:', error);
    console.log('Tip: Ensure your DB_HOST is accessible from the internet. "localhost" will not work in the preview environment.');
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: 3000 },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
