import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SupportRequest = sequelize.define('SupportRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'General',
  },
  status: {
    type: DataTypes.STRING, // 'pending', 'resolved', 'closed'
    defaultValue: 'pending',
  }
});

export default SupportRequest;
