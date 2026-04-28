import User from './User.js';
import Attendance from './Attendance.js';
import LeaveRequest from './LeaveRequest.js';
import Notification from './Notification.js';
import Branch from './Branch.js';
import LoginHistory from './LoginHistory.js';
import Department from './Department.js';

// User - Attendance
User.hasMany(Attendance, { foreignKey: 'userId' });
Attendance.belongsTo(User, { foreignKey: 'userId' });

// User - LeaveRequest
User.hasMany(LeaveRequest, { foreignKey: 'userId' });
LeaveRequest.belongsTo(User, { foreignKey: 'userId' });

// User - Notification
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// User - LoginHistory
User.hasMany(LoginHistory, { foreignKey: 'userId' });
LoginHistory.belongsTo(User, { foreignKey: 'userId' });

// Branch - User
Branch.hasMany(User, { foreignKey: 'branchId' });
User.belongsTo(Branch, { foreignKey: 'branchId' });

// Department - User
Department.hasMany(User, { foreignKey: 'departmentId' });
User.belongsTo(Department, { foreignKey: 'departmentId' });

export { User, Attendance, LeaveRequest, Notification, Branch, LoginHistory, Department };
