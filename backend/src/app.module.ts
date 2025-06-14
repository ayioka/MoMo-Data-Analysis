import { Module } from '@nestjs/common';
import { AppConfigModule } from './configs/app-configs.module';
import { SmsModule } from './modules/sms/sms.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from './configs/app-configs.service';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: async (appConfigService: AppConfigService) =>
        appConfigService.getPostgresInfo(),
    }),
    SmsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
