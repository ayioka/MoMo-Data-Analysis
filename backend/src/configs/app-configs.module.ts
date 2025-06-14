import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnvironmentVariables } from './validation';
import { AppConfigService } from './app-configs.service';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ validate: validateEnvironmentVariables })],
  providers: [ConfigService, AppConfigService],
  exports: [ConfigService, AppConfigService],
})
export class AppConfigModule {}
