import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SmsTransaction } from '../entities/sms-transaction.entity';
import { ProcessingLog, ProcessingStatus } from '../entities/processing-log.entity';
import { SmsParsingService, ParsedSmsData } from './sms-parsing.service';
import * as xml2js from 'xml2js';
import { v4 as uuidv4 } from 'uuid';

export interface ProcessingResult {
  uploadBatchId: string;
  totalProcessed: number;
  successfullyProcessed: number;
  failed: number;
  skipped: number;
  processingTime: number;
  errors: string[];
}

@Injectable()
export class SmsDataProcessingService {
  private readonly logger = new Logger(SmsDataProcessingService.name);

  constructor(
    @InjectRepository(SmsTransaction)
    private smsTransactionRepository: Repository<SmsTransaction>,
    @InjectRepository(ProcessingLog)
    private processingLogRepository: Repository<ProcessingLog>,
    private smsParsingService: SmsParsingService,
  ) {}

  async processXmlFile(
    xmlContent: string,
    fileName: string,
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const uploadBatchId = uuidv4();
    
    this.logger.log(`Starting processing of file: ${fileName} with batch ID: ${uploadBatchId}`);

    const result: ProcessingResult = {
      uploadBatchId,
      totalProcessed: 0,
      successfullyProcessed: 0,
      failed: 0,
      skipped: 0,
      processingTime: 0,
      errors: [],
    };

    try {
      // Parse XML
      const parser = new xml2js.Parser({
        explicitArray: false,
        trim: true,
        normalize: true,
      });

      const xmlData = await parser.parseStringPromise(xmlContent);
      
      // Extract SMS messages
      let smsMessages: any[] = [];
      
      if (xmlData.sms_data && xmlData.sms_data.sms) {
        if (Array.isArray(xmlData.sms_data.sms)) {
          smsMessages = xmlData.sms_data.sms;
        } else {
          smsMessages = [xmlData.sms_data.sms];
        }
      } else {
        throw new Error('Invalid XML structure. Expected sms_data root element with sms children.');
      }

      result.totalProcessed = smsMessages.length;
      this.logger.log(`Found ${smsMessages.length} SMS messages to process`);

      // Process each SMS message
      for (const smsData of smsMessages) {
        try {
          const messageBody = smsData.body || smsData._;
          
          if (!messageBody || typeof messageBody !== 'string') {
            await this.logProcessingResult(
              fileName,
              'No message body found',
              ProcessingStatus.SKIPPED,
              'Message body is empty or invalid',
              uploadBatchId,
              null,
            );
            result.skipped++;
            continue;
          }

          // Check if transaction already exists
          const existingTransaction = await this.checkDuplicateTransaction(messageBody);
          if (existingTransaction) {
            await this.logProcessingResult(
              fileName,
              messageBody,
              ProcessingStatus.SKIPPED,
              'Duplicate transaction detected',
              uploadBatchId,
              null,
            );
            result.skipped++;
            continue;
          }

          // Parse the SMS message
          const parsedData = this.smsParsingService.parseSmsMessage(messageBody);
          
          // Create transaction entity
          const transaction = this.createTransactionEntity(parsedData, messageBody);
          
          // Save transaction
          const savedTransaction = await this.smsTransactionRepository.save(transaction);
          
          // Log successful processing
          await this.logProcessingResult(
            fileName,
            messageBody,
            ProcessingStatus.SUCCESS,
            null,
            uploadBatchId,
            parsedData,
          );
          
          result.successfullyProcessed++;
          
        } catch (error) {
          this.logger.error(`Error processing SMS message: ${error.message}`, error.stack);
          
          const messageBody = smsData.body || smsData._ || 'Unknown message';
          await this.logProcessingResult(
            fileName,
            messageBody,
            ProcessingStatus.FAILED,
            error.message,
            uploadBatchId,
            null,
          );
          
          result.failed++;
          result.errors.push(`Message processing failed: ${error.message}`);
        }
      }

    } catch (error) {
      this.logger.error(`Error processing XML file ${fileName}: ${error.message}`, error.stack);
      result.errors.push(`XML parsing failed: ${error.message}`);
      result.failed = result.totalProcessed;
    }

    result.processingTime = Date.now() - startTime;
    
    this.logger.log(
      `Completed processing file: ${fileName}. ` +
      `Total: ${result.totalProcessed}, ` +
      `Success: ${result.successfullyProcessed}, ` +
      `Failed: ${result.failed}, ` +
      `Skipped: ${result.skipped}, ` +
      `Time: ${result.processingTime}ms`
    );

    return result;
  }

  private createTransactionEntity(
    parsedData: ParsedSmsData,
    originalMessage: string,
  ): SmsTransaction {
    const transaction = new SmsTransaction();
    
    transaction.originalMessage = originalMessage;
    transaction.transactionType = parsedData.transactionType;
    transaction.transactionId = parsedData.transactionId;
    transaction.amount = parsedData.amount;
    transaction.fee = parsedData.fee || 0;
    transaction.senderName = parsedData.senderName;
    transaction.receiverName = parsedData.receiverName;
    transaction.phoneNumber = parsedData.phoneNumber;
    transaction.agentName = parsedData.agentName;
    transaction.agentPhone = parsedData.agentPhone;
    transaction.serviceProvider = parsedData.serviceProvider;
    transaction.bundleType = parsedData.bundleType;
    transaction.bundleSize = parsedData.bundleSize;
    transaction.validityDays = parsedData.validityDays;
    transaction.transactionDate = parsedData.transactionDate || new Date();
    transaction.status = parsedData.status;
    transaction.description = parsedData.description;
    transaction.metadata = parsedData.metadata;

    return transaction;
  }

  private async checkDuplicateTransaction(messageBody: string): Promise<boolean> {
    // Check for duplicate based on original message or transaction ID
    const existingByMessage = await this.smsTransactionRepository.findOne({
      where: { originalMessage: messageBody },
    });

    if (existingByMessage) {
      return true;
    }

    // Extract transaction ID from message and check
    const transactionIdMatch = messageBody.match(/TxId:?\s*(\w+)|Transaction ID:?\s*(\w+)/i);
    if (transactionIdMatch) {
      const transactionId = transactionIdMatch[1] || transactionIdMatch[2];
      const existingByTxId = await this.smsTransactionRepository.findOne({
        where: { transactionId },
      });
      
      if (existingByTxId) {
        return true;
      }
    }

    return false;
  }

  private async logProcessingResult(
    fileName: string,
    originalMessage: string,
    status: ProcessingStatus,
    errorMessage: string | null,
    uploadBatchId: string,
    extractedData: ParsedSmsData | null,
  ): Promise<void> {
    try {
      const log = new ProcessingLog();
      log.fileName = fileName;
      log.originalMessage = originalMessage;
      log.processingStatus = status;
      log.errorMessage = errorMessage;
      log.uploadBatchId = uploadBatchId;
      log.extractedData = extractedData;
      
      if (status === ProcessingStatus.SKIPPED && !errorMessage) {
        log.reason = 'Duplicate transaction or invalid message format';
      }

      await this.processingLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to log processing result: ${error.message}`);
    }
  }

  async getProcessingStats(uploadBatchId?: string) {
    const whereCondition = uploadBatchId ? { uploadBatchId } : {};
    
    const [total, success, failed, skipped] = await Promise.all([
      this.processingLogRepository.count({ where: whereCondition }),
      this.processingLogRepository.count({ 
        where: { ...whereCondition, processingStatus: ProcessingStatus.SUCCESS } 
      }),
      this.processingLogRepository.count({ 
        where: { ...whereCondition, processingStatus: ProcessingStatus.FAILED } 
      }),
      this.processingLogRepository.count({ 
        where: { ...whereCondition, processingStatus: ProcessingStatus.SKIPPED } 
      }),
    ]);

    return {
      total,
      success,
      failed,
      skipped,
      successRate: total > 0 ? (success / total) * 100 : 0,
    };
  }

  async getProcessingLogs(uploadBatchId?: string, status?: ProcessingStatus) {
    const where: any = {};
    
    if (uploadBatchId) {
      where.uploadBatchId = uploadBatchId;
    }
    
    if (status) {
      where.processingStatus = status;
    }

    return this.processingLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100, // Limit to last 100 logs
    });
  }
}
