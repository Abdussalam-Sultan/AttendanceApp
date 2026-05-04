import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LeaveRequest = sequelize.define('LeaveRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING, // Annual Leave, Sick Leave, etc.
    allowNull: false,
  },
  duration: {
    type: DataTypes.STRING, // "5 Days"
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING, // Pending, Approved, Rejected
    defaultValue: 'Pending',
  },
  date: {
    type: DataTypes.STRING, // "25 May - 30 May 2024"
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
  },
  attachment: {
    type: DataTypes.STRING,
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

export default LeaveRequest;
