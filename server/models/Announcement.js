import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'General', // Default to General
  },
  date: {
    type: DataTypes.STRING,
  },
  timestamp: {
    type: DataTypes.STRING, // "2h ago"
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
});

export default Announcement;
