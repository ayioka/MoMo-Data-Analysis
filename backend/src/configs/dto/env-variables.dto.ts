import { Exclude, Expose } from 'class-transformer';
import { IsEnum, IsNumber } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
  Test = 'test',
  Local = 'local',
}

@Exclude()
export class EnvironmentVariables {
  @Expose()
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @Expose()
  @IsNumber()
  APP_PORT: number;

  @Expose()
  DB_HOST: string;

  @Expose()
  DB_PORT: number;

  @Expose()
  DB_USER: string;

  @Expose()
  DB_PASS: string;

  @Expose()
  DB_NAME: string;
}
