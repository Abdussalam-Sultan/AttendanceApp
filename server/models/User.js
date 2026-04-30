import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'Employee',
  },
  department: {
    type: DataTypes.STRING,
    defaultValue: 'General',
  },
  employeeId: {
    type: DataTypes.STRING,
    unique: true,
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.TEXT,
  },
  emergencyContact: {
    type: DataTypes.STRING,
  },
  birthDate: {
    type: DataTypes.STRING,
  },
  joinDate: {
    type: DataTypes.STRING,
    defaultValue: new Date().toISOString().split('T')[0],
  },
  contractType: {
    type: DataTypes.STRING,
    defaultValue: 'Full-time',
  },
  manager: {
    type: DataTypes.STRING,
    defaultValue: 'HR Department',
  },
  location: {
    type: DataTypes.STRING,
    defaultValue: 'Main Office',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Active', // 'Active' or 'Deactivated'
  },
  leaveBalance: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
  },
  branchId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  notifSettings: {
    type: DataTypes.JSON,
  },
  securitySettings: {
    type: DataTypes.JSON,
  },
  deviceId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
}, {
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default User;
