import User from './User.js';
import Attendance from './Attendance.js';
import LeaveRequest from './LeaveRequest.js';
import Notification from './Notification.js';
import Branch from './Branch.js';
import LoginHistory from './LoginHistory.js';
import Department from './Department.js';
import SupportContact from './SupportContact.js';
import SupportRequest from './SupportRequest.js';
import Company from './Company.js';
import Announcement from './Announcement.js';

// Company - Everything
Company.hasMany(User, { foreignKey: 'companyId' });
User.belongsTo(Company, { foreignKey: 'companyId' });

Company.hasMany(Attendance, { foreignKey: 'companyId' });
Attendance.belongsTo(Company, { foreignKey: 'companyId' });

Company.hasMany(Branch, { foreignKey: 'companyId' });
Branch.belongsTo(Company, { foreignKey: 'companyId' });

Company.hasMany(Department, { foreignKey: 'companyId' });
Department.belongsTo(Company, { foreignKey: 'companyId' });

Company.hasMany(LeaveRequest, { foreignKey: 'companyId' });
LeaveRequest.belongsTo(Company, { foreignKey: 'companyId' });

Company.hasMany(Announcement, { foreignKey: 'companyId' });
Announcement.belongsTo(Company, { foreignKey: 'companyId' });

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

// User - SupportRequest
User.hasMany(SupportRequest, { foreignKey: 'userId' });
SupportRequest.belongsTo(User, { foreignKey: 'userId' });

export { User, Attendance, LeaveRequest, Notification, Branch, LoginHistory, Department, SupportContact, SupportRequest, Company, Announcement };
