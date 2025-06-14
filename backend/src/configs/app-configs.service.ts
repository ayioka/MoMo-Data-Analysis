import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment, EnvironmentVariables } from './dto/env-variables.dto';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService<EnvironmentVariables>) {}

  get port(): number {
    return this.configService.get('APP_PORT');
  }

  get environment(): string {
    return this.configService.get('NODE_ENV');
  }

  get dbHost(): string {
    return this.configService.get('DB_HOST');
  }

  get dbPort(): number {
    return this.configService.get('DB_PORT');
  }

  get dbUser(): string {
    return this.configService.get('DB_USER');
  }

  get dbPass(): string {
    return this.configService.get('DB_PASS');
  }

  get dbName(): string {
    return this.configService.get('DB_NAME');
  }

  getPostgresInfo(): TypeOrmModuleOptions {
    return {
      name: 'default',
      type: 'postgres',
      host: this.dbHost,
      port: this.dbPort,
      username: this.dbUser,
      password: this.dbPass,
      database: this.dbName,
      migrations: ['dist/db/migrations/**/*.js'],
      entities: ['dist/**/*.entity.js'],
      synchronize: this.environment !== Environment.Production,
      migrationsRun: this.environment === Environment.Production,
      dropSchema: false,
      cache: false,
      logging: false,
    };
  }
}
