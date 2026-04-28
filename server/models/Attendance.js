import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING, // Format: "DD MMM"
    allowNull: false,
  },
  day: {
    type: DataTypes.STRING, // Format: "Monday"
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING, // present, late, absent, leave
    allowNull: false,
  },
  checkIn: {
    type: DataTypes.STRING, // Format: "08:52 AM"
  },
  checkOut: {
    type: DataTypes.STRING, // Format: "05:30 PM"
  },
  checkOutStatus: {
    type: DataTypes.STRING, // Early Leave, On Time, Overtime
  },
  workedMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lateMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
});

export default Attendance;
