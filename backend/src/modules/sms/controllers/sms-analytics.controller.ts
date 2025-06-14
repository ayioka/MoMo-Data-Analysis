import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SmsAnalyticsService } from '../services/sms-analytics.service';
import { AnalyticsQueryDto } from '../dto/query.dto';
import {
  TransactionStatsDto,
  MonthlyStatsDto,
  DailyStatsDto,
  TypeDistributionDto,
} from '../dto/response.dto';
import { TransactionType } from '../entities/sms-transaction.entity';

@ApiTags('SMS Analytics')
@Controller('sms/analytics')
export class SmsAnalyticsController {
  constructor(
    private readonly smsAnalyticsService: SmsAnalyticsService,
  ) {}

  @Get('overview')
  @ApiOperation({ 
    summary: 'Get overall transaction statistics',
    description: 'Retrieve comprehensive statistics including totals, averages, and distribution by type and status'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Overall statistics retrieved successfully',
    type: TransactionStatsDto,
  })
  async getOverallStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TransactionStatsDto> {
    return this.smsAnalyticsService.getOverallStats(startDate, endDate);
  }

  @Get('monthly')
  @ApiOperation({ 
    summary: 'Get monthly transaction statistics',
    description: 'Retrieve transaction statistics grouped by month'
  })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter by specific year' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Monthly statistics retrieved successfully',
    type: [MonthlyStatsDto],
  })
  async getMonthlyStats(
    @Query('year') year?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<MonthlyStatsDto[]> {
    return this.smsAnalyticsService.getMonthlyStats(year, startDate, endDate);
  }

  @Get('daily')
  @ApiOperation({ 
    summary: 'Get daily transaction statistics',
    description: 'Retrieve transaction statistics grouped by day for a specified date range'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Daily statistics retrieved successfully',
    type: [DailyStatsDto],
  })
  async getDailyStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<DailyStatsDto[]> {
    return this.smsAnalyticsService.getDailyStats(startDate, endDate);
  }

  @Get('type-distribution')
  @ApiOperation({ 
    summary: 'Get transaction type distribution',
    description: 'Retrieve the distribution of transactions by type with counts, amounts, and percentages'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Type distribution retrieved successfully',
    type: [TypeDistributionDto],
  })
  async getTransactionTypeDistribution(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<TypeDistributionDto[]> {
    return this.smsAnalyticsService.getTransactionTypeDistribution(startDate, endDate);
  }

  @Get('top-transactions')
  @ApiOperation({ 
    summary: 'Get top transactions by amount',
    description: 'Retrieve the highest value transactions with optional filtering by type and date range'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of transactions to return (default: 10)' })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType, description: 'Filter by transaction type' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  async getTopTransactions(
    @Query('limit') limit?: number,
    @Query('type') transactionType?: TransactionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.smsAnalyticsService.getTopTransactions(
      limit || 10,
      transactionType,
      startDate,
      endDate,
    );
  }

  @Get('trends')
  @ApiOperation({ 
    summary: 'Get transaction trends over time',
    description: 'Retrieve transaction trends grouped by specified time periods'
  })
  async getTransactionTrends(@Query() queryDto: AnalyticsQueryDto) {
    return this.smsAnalyticsService.getTransactionTrends(queryDto);
  }

  @Get('service-providers')
  @ApiOperation({ 
    summary: 'Get statistics by service provider',
    description: 'Retrieve transaction statistics grouped by service provider'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  async getServiceProviderStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.smsAnalyticsService.getServiceProviderStats(startDate, endDate);
  }

  @Get('agents')
  @ApiOperation({ 
    summary: 'Get agent performance statistics',
    description: 'Retrieve transaction statistics grouped by agent'
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
  async getAgentStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.smsAnalyticsService.getAgentStats(startDate, endDate);
  }

  @Get('summary')
  @ApiOperation({ 
    summary: 'Get analytics summary dashboard',
    description: 'Retrieve a comprehensive summary for dashboard display including key metrics and recent trends'
  })
  async getAnalyticsSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const [
      overallStats,
      typeDistribution,
      recentMonthlyStats,
      serviceProviders,
    ] = await Promise.all([
      this.smsAnalyticsService.getOverallStats(startDate, endDate),
      this.smsAnalyticsService.getTransactionTypeDistribution(startDate, endDate),
      this.smsAnalyticsService.getMonthlyStats(new Date().getFullYear(), startDate, endDate),
      this.smsAnalyticsService.getServiceProviderStats(startDate, endDate),
    ]);

    return {
      overview: overallStats,
      typeDistribution,
      monthlyTrends: recentMonthlyStats.slice(-6), // Last 6 months
      serviceProviders,
      lastUpdated: new Date().toISOString(),
    };
  }
}
