import {
  DATABASE_CONNECTION,
  DATABASE_DB_NAME,
  DATABASE_HOST,
  DATABASE_PASSWORD,
  DATABASE_USERNAME,
} from './config';
export default (): Record<string, any> => ({
  databaseConnection: DATABASE_CONNECTION,
  databaseHost: DATABASE_HOST,
  databasePort: process.env.DATABASE_PORT,
  databaseUsername: DATABASE_USERNAME,
  databasePassword: DATABASE_PASSWORD,
  databaseName: DATABASE_DB_NAME,
});
