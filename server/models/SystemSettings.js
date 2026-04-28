import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SystemSettings = sequelize.define('SystemSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  workStartTime: {
    type: DataTypes.STRING, // e.g., "09:00"
    defaultValue: "09:00",
  },
  workEndTime: {
    type: DataTypes.STRING, // e.g., "17:00"
    defaultValue: "17:00",
  },
  graceMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
  },
  overtimeStartMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 30, // minutes after workEndTime to consider overtime
  },
  geofencingEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  geofencingRadius: {
    type: DataTypes.INTEGER,
    defaultValue: 500, // in meters
  },
  biometricEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  workingDays: {
    type: DataTypes.STRING,
    defaultValue: "Monday,Tuesday,Wednesday,Thursday,Friday",
  }
});

export default SystemSettings;
