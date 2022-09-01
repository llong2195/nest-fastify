import { DATABASE_HOST, DATABASE_PORT, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_DB_NAME } from '@config/config';
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: DATABASE_HOST || 'localhost',
  port: DATABASE_PORT || 3306,
  username: DATABASE_USERNAME || 'root',
  password: DATABASE_PASSWORD || 'password',
  database: DATABASE_DB_NAME || 'test',
  dropSchema: false,
  keepConnectionAlive: true,
  logging: true,
  migrations: ['src/database/migrations/*.ts'],
} as DataSourceOptions);
