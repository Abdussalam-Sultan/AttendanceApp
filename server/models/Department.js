import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  code: {
    type: DataTypes.STRING,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: true,
  }
}, {
  indexes: [
    { fields: ['companyId'] },
    { fields: ['name', 'companyId'], unique: true },
    { fields: ['code', 'companyId'], unique: true }
  ]
});

export default Department;
