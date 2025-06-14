import { DataSourceOptions, DataSource } from 'typeorm';

const isProduction = process.env.NODE_ENV === 'production';

const config: DataSourceOptions = {
  name: 'default',
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number.parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  migrations: ['dist/db/migrations/**/*.js'],
  entities: ['dist/**/*.entity.js'],
  synchronize: !isProduction,
  migrationsRun: isProduction,
  dropSchema: false,
  cache: false,
  logging: false,
};

export default new DataSource(config);
