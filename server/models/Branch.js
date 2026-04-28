import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Branch = sequelize.define('Branch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  location: {
    type: DataTypes.STRING,
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
  }
});

export default Branch;
