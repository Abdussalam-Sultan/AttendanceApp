import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();


let sequelize;

if (process.env.DB_URL) {
  // Use DATABASE_URL (Render / Railway style)
  sequelize = new Sequelize(process.env.DB_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: process.env.DB_DIALECT || "postgres",
      logging: false,
    }
  );
} 

if (!sequelize) {
  console.error('❌ No database configuration found. Please set DATABASE_URL or DB_HOST/DB_NAME in your environment.');
}

export default sequelize;
