import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SmsDataProcessingService } from '../services/sms-data-processing.service';
import { UploadResponseDto } from '../dto/response.dto';

@ApiTags('SMS Data Upload')
@Controller('sms/upload')
export class SmsUploadController {
  constructor(
    private readonly smsDataProcessingService: SmsDataProcessingService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ 
    summary: 'Upload and process SMS XML file',
    description: 'Upload an XML file containing SMS data for processing and storage in the database'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'XML file containing SMS data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded and processed successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file or file format',
  })
  async uploadSmsData(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.originalname.toLowerCase().endsWith('.xml')) {
      throw new BadRequestException('Only XML files are allowed');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new BadRequestException('File size too large. Maximum allowed size is 50MB');
    }

    try {
      const xmlContent = file.buffer.toString('utf-8');
      const result = await this.smsDataProcessingService.processXmlFile(
        xmlContent,
        file.originalname,
      );

      return {
        success: true,
        message: 'File processed successfully',
        uploadBatchId: result.uploadBatchId,
        totalProcessed: result.totalProcessed,
        successfullyProcessed: result.successfullyProcessed,
        failed: result.failed,
        skipped: result.skipped,
        processingTime: result.processingTime,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to process file: ${error.message}`);
    }
  }

  @Get('status/:batchId')
  @ApiOperation({ 
    summary: 'Get processing status for a batch',
    description: 'Retrieve detailed processing statistics for a specific upload batch'
  })
  @ApiResponse({
    status: 200,
    description: 'Processing status retrieved successfully',
  })
  async getProcessingStatus(@Param('batchId') batchId: string) {
    return this.smsDataProcessingService.getProcessingStats(batchId);
  }

  @Get('logs')
  @ApiOperation({ 
    summary: 'Get processing logs',
    description: 'Retrieve processing logs with optional filtering by batch ID and status'
  })
  async getProcessingLogs(
    @Query('batchId') batchId?: string,
    @Query('status') status?: string,
  ) {
    return this.smsDataProcessingService.getProcessingLogs(batchId, status as any);
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get overall processing statistics',
    description: 'Retrieve overall processing statistics across all uploads'
  })
  async getOverallStats() {
    return this.smsDataProcessingService.getProcessingStats();
  }
}
