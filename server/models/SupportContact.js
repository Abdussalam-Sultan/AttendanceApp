import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SupportContact = sequelize.define('SupportContact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.STRING, // 'email', 'phone', 'whatsapp', 'address'
    allowNull: false,
  },
  label: {
    type: DataTypes.STRING, // e.g. 'Customer Support', 'Emergency Line'
    allowNull: false,
  },
  value: {
    type: DataTypes.STRING, // e.g. 'support@doorlog.com'
    allowNull: false,
  },
  iconName: {
    type: DataTypes.STRING, // Lucide icon name
    defaultValue: 'MessageSquare',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
});

export default SupportContact;
