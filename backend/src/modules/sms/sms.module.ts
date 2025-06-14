import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

// Entities
import { SmsTransaction } from './entities/sms-transaction.entity';
import { ProcessingLog } from './entities/processing-log.entity';

// Services
import { SmsParsingService } from './services/sms-parsing.service';
import { SmsDataProcessingService } from './services/sms-data-processing.service';
import { SmsTransactionService } from './services/sms-transaction.service';
import { SmsAnalyticsService } from './services/sms-analytics.service';

// Controllers
import { SmsUploadController } from './controllers/sms-upload.controller';
import { SmsTransactionController } from './controllers/sms-transaction.controller';
import { SmsAnalyticsController } from './controllers/sms-analytics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmsTransaction, ProcessingLog]),
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/xml' || file.originalname.toLowerCase().endsWith('.xml')) {
          cb(null, true);
        } else {
          cb(new Error('Only XML files are allowed'), false);
        }
      },
    }),
  ],
  controllers: [
    SmsUploadController,
    SmsTransactionController,
    SmsAnalyticsController,
  ],
  providers: [
    SmsParsingService,
    SmsDataProcessingService,
    SmsTransactionService,
    SmsAnalyticsService,
  ],
  exports: [
    SmsParsingService,
    SmsDataProcessingService,
    SmsTransactionService,
    SmsAnalyticsService,
  ],
})
export class SmsModule {}
