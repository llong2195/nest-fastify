import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 3306,
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_DB_NAME || 'ttt',
  dropSchema: false,
  keepConnectionAlive: true,
  logging: true,
  migrations: ['src/database/migrations/*.ts'],
} as DataSourceOptions);
