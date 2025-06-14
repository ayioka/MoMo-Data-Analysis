import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SmsTransaction, TransactionType } from '../entities/sms-transaction.entity';
import { AnalyticsQueryDto } from '../dto/query.dto';
import {
  TransactionStatsDto,
  MonthlyStatsDto,
  DailyStatsDto,
  TypeDistributionDto,
} from '../dto/response.dto';

@Injectable()
export class SmsAnalyticsService {
  constructor(
    @InjectRepository(SmsTransaction)
    private smsTransactionRepository: Repository<SmsTransaction>,
  ) {}

  async getOverallStats(
    startDate?: string,
    endDate?: string,
  ): Promise<TransactionStatsDto> {
    const queryBuilder = this.smsTransactionRepository.createQueryBuilder('transaction');

    if (startDate || endDate) {
      this.addDateFilter(queryBuilder, startDate, endDate);
    }

    const [transactions, totalCount] = await queryBuilder.getManyAndCount();

    const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalFees = transactions.reduce((sum, t) => sum + (t.fee || 0), 0);
    const averageTransaction = totalCount > 0 ? totalAmount / totalCount : 0;

    // Count by transaction type
    const transactionsByType = transactions.reduce((acc, t) => {
      acc[t.transactionType] = (acc[t.transactionType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count by status
    const transactionsByStatus = transactions.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTransactions: totalCount,
      totalAmount,
      totalFees,
      averageTransaction,
      transactionsByType,
      transactionsByStatus,
    };
  }

  async getMonthlyStats(
    year?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<MonthlyStatsDto[]> {
    const queryBuilder = this.smsTransactionRepository
      .createQueryBuilder('transaction')
      .select([
        'EXTRACT(MONTH FROM transaction.transactionDate) as month',
        'EXTRACT(YEAR FROM transaction.transactionDate) as year',
        'COUNT(*) as totalTransactions',
        'SUM(transaction.amount) as totalAmount',
        'SUM(transaction.fee) as totalFees',
        'AVG(transaction.amount) as averageTransaction',
      ])
      .groupBy('EXTRACT(YEAR FROM transaction.transactionDate), EXTRACT(MONTH FROM transaction.transactionDate)')
      .orderBy('year', 'ASC')
      .addOrderBy('month', 'ASC');

    if (year) {
      queryBuilder.where('EXTRACT(YEAR FROM transaction.transactionDate) = :year', { year });
    }

    if (startDate || endDate) {
      this.addDateFilter(queryBuilder, startDate, endDate);
    }

    const results = await queryBuilder.getRawMany();

    return results.map(result => ({
      month: this.getMonthName(parseInt(result.month)),
      year: parseInt(result.year),
      totalTransactions: parseInt(result.totalTransactions),
      totalAmount: parseFloat(result.totalAmount) || 0,
      totalFees: parseFloat(result.totalFees) || 0,
      averageTransaction: parseFloat(result.averageTransaction) || 0,
    }));
  }

  async getDailyStats(
    startDate?: string,
    endDate?: string,
  ): Promise<DailyStatsDto[]> {
    const queryBuilder = this.smsTransactionRepository
      .createQueryBuilder('transaction')
      .select([
        'DATE(transaction.transactionDate) as date',
        'COUNT(*) as totalTransactions',
        'SUM(transaction.amount) as totalAmount',
        'SUM(transaction.fee) as totalFees',
      ])
      .groupBy('DATE(transaction.transactionDate)')
      .orderBy('date', 'ASC');

    this.addDateFilter(queryBuilder, startDate, endDate);

    const results = await queryBuilder.getRawMany();

    return results.map(result => ({
      date: result.date,
      totalTransactions: parseInt(result.totalTransactions),
      totalAmount: parseFloat(result.totalAmount) || 0,
      totalFees: parseFloat(result.totalFees) || 0,
    }));
  }

  async getTransactionTypeDistribution(
    startDate?: string,
    endDate?: string,
  ): Promise<TypeDistributionDto[]> {
    const queryBuilder = this.smsTransactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.transactionType as type',
        'COUNT(*) as count',
        'SUM(transaction.amount) as totalAmount',
      ])
      .groupBy('transaction.transactionType')
      .orderBy('count', 'DESC');

    if (startDate || endDate) {
      this.addDateFilter(queryBuilder, startDate, endDate);
    }

    const results = await queryBuilder.getRawMany();
    const totalTransactions = results.reduce((sum, r) => sum + parseInt(r.count), 0);

    return results.map(result => ({
      type: this.formatTransactionType(result.type),
      count: parseInt(result.count),
      totalAmount: parseFloat(result.totalAmount) || 0,
      percentage: totalTransactions > 0 ? (parseInt(result.count) / totalTransactions) * 100 : 0,
    }));
  }

  async getTopTransactions(
    limit: number = 10,
    transactionType?: TransactionType,
    startDate?: string,
    endDate?: string,
  ): Promise<SmsTransaction[]> {
    const queryBuilder = this.smsTransactionRepository
      .createQueryBuilder('transaction')
      .orderBy('transaction.amount', 'DESC')
      .take(limit);

    if (transactionType) {
      queryBuilder.where('transaction.transactionType = :transactionType', { transactionType });
    }

    if (startDate || endDate) {
      this.addDateFilter(queryBuilder, startDate, endDate);
    }

    return queryBuilder.getMany();
  }

  async getTransactionTrends(queryDto: AnalyticsQueryDto) {
    const { startDate, endDate, groupBy } = queryDto;
    
    let dateFormat: string;
    let groupByClause: string;
    
    switch (groupBy) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        groupByClause = 'DATE(transaction.transactionDate)';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        groupByClause = 'DATE_TRUNC(\'week\', transaction.transactionDate)';
        break;
      case 'year':
        dateFormat = 'YYYY';
        groupByClause = 'EXTRACT(YEAR FROM transaction.transactionDate)';
        break;
      default: // month
        dateFormat = 'YYYY-MM';
        groupByClause = 'DATE_TRUNC(\'month\', transaction.transactionDate)';
    }

    const queryBuilder = this.smsTransactionRepository
      .createQueryBuilder('transaction')
      .select([
        `${groupByClause} as period`,
        'transaction.transactionType as type',
        'COUNT(*) as count',
        'SUM(transaction.amount) as totalAmount',
      ])
      .groupBy(`${groupByClause}, transaction.transactionType`)
      .orderBy('period', 'ASC');

    this.addDateFilter(queryBuilder, startDate, endDate);

    const results = await queryBuilder.getRawMany();

    // Group results by period
    const groupedResults = results.reduce((acc, result) => {
      const period = result.period;
      if (!acc[period]) {
        acc[period] = {
          period,
          types: {},
          totalTransactions: 0,
          totalAmount: 0,
        };
      }
      
      acc[period].types[result.type] = {
        count: parseInt(result.count),
        amount: parseFloat(result.totalAmount) || 0,
      };
      
      acc[period].totalTransactions += parseInt(result.count);
      acc[period].totalAmount += parseFloat(result.totalAmount) || 0;
      
      return acc;
    }, {});

    return Object.values(groupedResults);
  }

  async getServiceProviderStats(
    startDate?: string,
    endDate?: string,
  ) {
    const queryBuilder = this.smsTransactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.serviceProvider as provider',
        'COUNT(*) as count',
        'SUM(transaction.amount) as totalAmount',
        'SUM(transaction.fee) as totalFees',
      ])
      .where('transaction.serviceProvider IS NOT NULL')
      .groupBy('transaction.serviceProvider')
      .orderBy('count', 'DESC');

    if (startDate || endDate) {
      this.addDateFilter(queryBuilder, startDate, endDate);
    }

    const results = await queryBuilder.getRawMany();

    return results.map(result => ({
      provider: result.provider,
      count: parseInt(result.count),
      totalAmount: parseFloat(result.totalAmount) || 0,
      totalFees: parseFloat(result.totalFees) || 0,
    }));
  }

  async getAgentStats(
    startDate?: string,
    endDate?: string,
  ) {
    const queryBuilder = this.smsTransactionRepository
      .createQueryBuilder('transaction')
      .select([
        'transaction.agentName as agentName',
        'transaction.agentPhone as agentPhone',
        'COUNT(*) as count',
        'SUM(transaction.amount) as totalAmount',
      ])
      .where('transaction.agentName IS NOT NULL')
      .groupBy('transaction.agentName, transaction.agentPhone')
      .orderBy('count', 'DESC');

    if (startDate || endDate) {
      this.addDateFilter(queryBuilder, startDate, endDate);
    }

    const results = await queryBuilder.getRawMany();

    return results.map(result => ({
      agentName: result.agentName,
      agentPhone: result.agentPhone,
      transactionCount: parseInt(result.count),
      totalAmount: parseFloat(result.totalAmount) || 0,
    }));
  }

  private addDateFilter(queryBuilder: any, startDate?: string, endDate?: string) {
    if (startDate && endDate) {
      queryBuilder.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate + ' 23:59:59'),
      });
    } else if (startDate) {
      queryBuilder.andWhere('transaction.transactionDate >= :startDate', {
        startDate: new Date(startDate),
      });
    } else if (endDate) {
      queryBuilder.andWhere('transaction.transactionDate <= :endDate', {
        endDate: new Date(endDate + ' 23:59:59'),
      });
    }
  }

  private getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  }

  private formatTransactionType(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
