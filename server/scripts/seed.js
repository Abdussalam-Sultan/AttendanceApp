import { faker } from '@faker-js/faker';
import sequelize from '../config/database.js';
import '../models/associations.js';
import { User, Attendance, LeaveRequest, Notification, Branch, Department, Company, Announcement } from '../models/associations.js';
import bcrypt from 'bcryptjs';

export async function seedDatabase(count = 10, targetCompanyId = null) {
  try {
    console.log(`Starting seed of ${count} records for company ${targetCompanyId || 'new'}...`);

    // 1. Get or Create Company
    let company;
    if (targetCompanyId) {
      company = await Company.findByPk(targetCompanyId);
    }
    
    if (!company) {
      company = await Company.findOne();
    }

    if (!company) {
      company = await Company.create({
        name: faker.company.name(),
        status: 'Active'
      });
    }

    // 2. Create Branches
    const branches = [];
    for (let i = 0; i < 3; i++) {
        const branchName = faker.company.name() + ' Branch';
        const [branch] = await Branch.findOrCreate({
            where: { name: branchName, companyId: company.id },
            defaults: {
                location: faker.location.streetAddress(),
                code: faker.string.alphanumeric(5).toUpperCase(),
                companyId: company.id
            }
        });
        branches.push(branch);
    }

    // 3. Create Departments
    const departments = [];
    const deptNames = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Design'];
    for (const name of deptNames) {
        const [dept] = await Department.findOrCreate({
            where: { name, companyId: company.id },
            defaults: {
                code: name.substring(0, 3).toUpperCase(),
                companyId: company.id
            }
        });
        departments.push(dept);
    }

    // 4. Create Users (Managers and Employees)
    const users = [];
    
    for (let i = 0; i < count; i++) {
      const isManager = i < (count / 5); // 20% managers
      const branch = faker.helpers.arrayElement(branches);
      const department = faker.helpers.arrayElement(departments);
      const email = faker.internet.email().toLowerCase();

      try {
        const user = await User.create({
          name: faker.person.fullName(),
          email: email,
          password: 'password123',
          role: isManager ? 'Manager' : 'Employee',
          department: department.name,
          employeeId: 'EMP-' + faker.string.numeric(5) + '-' + i,
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          joinDate: faker.date.past({ years: 2 }).toISOString().split('T')[0],
          branchId: branch.id,
          location: branch.name,
          departmentId: department.id,
          companyId: company.id,
          onboardingCompleted: true,
          status: 'Active'
        });
        users.push(user);
      } catch (err) {
        console.warn(`Could not create user ${email}:`, err.message);
      }
    }

    // 5. Create Attendances
    if (users.length > 0) {
      const attendanceRecords = [];
      for (const user of users) {
          // Seed last 10 days of attendance (reduced further to prevent timeouts)
          for (let i = 0; i < 10; i++) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              
              if (date.getDay() === 0 || date.getDay() === 6) continue;

              const status = faker.helpers.arrayElement(['present', 'present', 'present', 'late', 'absent']);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
              const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

              attendanceRecords.push({
                  userId: user.id,
                  date: dateStr,
                  day: dayName,
                  status,
                  checkIn: status === 'present' || status === 'late' ? '08:' + faker.string.numeric(2).padStart(2, '0') + ' AM' : null,
                  checkOut: status === 'present' || status === 'late' ? '05:' + faker.string.numeric(2).padStart(2, '0') + ' PM' : null,
                  workedMinutes: status === 'present' || status === 'late' ? 480 + faker.number.int({ min: -30, max: 60 }) : 0,
                  companyId: company.id,
                  branchName: user.location || 'Main Office',
                  departmentName: user.department
              });
          }
      }
      if (attendanceRecords.length > 0) {
        await Attendance.bulkCreate(attendanceRecords);
      }
    }

    // 6. Create Announcements
    for (let i = 0; i < 5; i++) {
        await Announcement.create({
            title: faker.lorem.sentence(),
            content: faker.lorem.paragraphs(1),
            type: faker.helpers.arrayElement(['General', 'Urgent', 'Policy']),
            targetDepartment: faker.helpers.arrayElement([...deptNames, 'All']),
            companyId: company.id
        });
    }

    console.log('Seeding completed successfully!');
    return { success: true, message: `Seeded ${users.length} users and their related data.` };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
