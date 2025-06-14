import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  uploadBatchId: string;

  @ApiProperty()
  totalProcessed: number;

  @ApiProperty()
  successfullyProcessed: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  skipped: number;

  @ApiProperty()
  processingTime: number;
}

export class TransactionStatsDto {
  @ApiProperty()
  totalTransactions: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  totalFees: number;

  @ApiProperty()
  averageTransaction: number;

  @ApiProperty()
  transactionsByType: Record<string, number>;

  @ApiProperty()
  transactionsByStatus: Record<string, number>;
}

export class MonthlyStatsDto {
  @ApiProperty()
  month: string;

  @ApiProperty()
  year: number;

  @ApiProperty()
  totalTransactions: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  totalFees: number;

  @ApiProperty()
  averageTransaction: number;
}

export class DailyStatsDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  totalTransactions: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  totalFees: number;
}

export class TypeDistributionDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  percentage: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
