import { IsOptional, IsString, IsNumber, IsDateString, IsEnum, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ description: 'Page number', example: 1, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Number of items per page', example: 10, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 10;
}

export class DateRangeDto {
  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class TransactionFilterDto extends PaginationDto {
  @ApiProperty({ description: 'Transaction type', required: false })
  @IsOptional()
  @IsString()
  transactionType?: string;

  @ApiProperty({ description: 'Minimum amount', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @ApiProperty({ description: 'Maximum amount', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Search term for names, phone numbers, etc.', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Transaction status', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AnalyticsQueryDto extends DateRangeDto {
  @ApiProperty({ description: 'Group by period (day, week, month, year)', required: false })
  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month' | 'year' = 'month';
}
