import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // null means it's a broadcast to all users
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('POLICY_CHANGE', 'ANNOUNCEMENT', 'LEAVE_STATUS', 'ATTENDANCE_STATUS', 'SYSTEM'),
    defaultValue: 'SYSTEM',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

export default Notification;
