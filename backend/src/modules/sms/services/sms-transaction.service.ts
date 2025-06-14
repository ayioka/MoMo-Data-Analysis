import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { SmsTransaction, TransactionType, TransactionStatus } from '../entities/sms-transaction.entity';
import { TransactionFilterDto } from '../dto/query.dto';
import { PaginatedResponseDto } from '../dto/response.dto';

@Injectable()
export class SmsTransactionService {
  constructor(
    @InjectRepository(SmsTransaction)
    private smsTransactionRepository: Repository<SmsTransaction>,
  ) {}

  async findAll(filterDto: TransactionFilterDto): Promise<PaginatedResponseDto<SmsTransaction>> {
    const {
      page = 1,
      limit = 10,
      transactionType,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      search,
      status,
    } = filterDto;

    const queryBuilder = this.smsTransactionRepository.createQueryBuilder('transaction');

    // Apply filters
    if (transactionType) {
      queryBuilder.andWhere('transaction.transactionType = :transactionType', { transactionType });
    }

    if (status) {
      queryBuilder.andWhere('transaction.status = :status', { status });
    }

    if (minAmount !== undefined) {
      queryBuilder.andWhere('transaction.amount >= :minAmount', { minAmount });
    }

    if (maxAmount !== undefined) {
      queryBuilder.andWhere('transaction.amount <= :maxAmount', { maxAmount });
    }

    if (startDate || endDate) {
      this.addDateFilter(queryBuilder, startDate, endDate);
    }

    if (search) {
      queryBuilder.andWhere(
        '(transaction.senderName ILIKE :search OR ' +
        'transaction.receiverName ILIKE :search OR ' +
        'transaction.phoneNumber ILIKE :search OR ' +
        'transaction.agentName ILIKE :search OR ' +
        'transaction.transactionId ILIKE :search OR ' +
        'transaction.originalMessage ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Count total records
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder
      .orderBy('transaction.transactionDate', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .offset(offset)
      .limit(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<SmsTransaction> {
    const transaction = await this.smsTransactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async findByTransactionId(transactionId: string): Promise<SmsTransaction> {
    const transaction = await this.smsTransactionRepository.findOne({
      where: { transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${transactionId} not found`);
    }

    return transaction;
  }

  async getTransactionTypes(): Promise<{ type: string; label: string }[]> {
    const types = Object.values(TransactionType).map(type => ({
      type,
      label: this.formatTransactionType(type),
    }));

    return types;
  }

  async getTransactionStatuses(): Promise<{ status: string; label: string }[]> {
    const statuses = Object.values(TransactionStatus).map(status => ({
      status,
      label: this.formatTransactionStatus(status),
    }));

    return statuses;
  }

  async searchTransactions(searchTerm: string, limit: number = 10): Promise<SmsTransaction[]> {
    const queryBuilder = this.smsTransactionRepository
      .createQueryBuilder('transaction')
      .where(
        '(transaction.senderName ILIKE :search OR ' +
        'transaction.receiverName ILIKE :search OR ' +
        'transaction.phoneNumber ILIKE :search OR ' +
        'transaction.agentName ILIKE :search OR ' +
        'transaction.transactionId ILIKE :search)',
        { search: `%${searchTerm}%` }
      )
      .orderBy('transaction.transactionDate', 'DESC')
      .limit(limit);

    return queryBuilder.getMany();
  }

  async getRecentTransactions(limit: number = 10): Promise<SmsTransaction[]> {
    return this.smsTransactionRepository.find({
      order: {
        transactionDate: 'DESC',
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  async getTransactionsByType(
    transactionType: TransactionType,
    limit: number = 10,
    offset: number = 0,
  ): Promise<SmsTransaction[]> {
    return this.smsTransactionRepository.find({
      where: { transactionType },
      order: {
        transactionDate: 'DESC',
      },
      take: limit,
      skip: offset,
    });
  }

  async getTransactionsByDateRange(
    startDate: Date,
    endDate: Date,
    limit?: number,
  ): Promise<SmsTransaction[]> {
    const queryBuilder = this.smsTransactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('transaction.transactionDate', 'DESC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    return queryBuilder.getMany();
  }

  async getTransactionsByAgent(agentName: string): Promise<SmsTransaction[]> {
    return this.smsTransactionRepository.find({
      where: { agentName: Like(`%${agentName}%`) },
      order: {
        transactionDate: 'DESC',
      },
    });
  }

  async getTransactionsByPhoneNumber(phoneNumber: string): Promise<SmsTransaction[]> {
    return this.smsTransactionRepository.find({
      where: [
        { phoneNumber: Like(`%${phoneNumber}%`) },
        { agentPhone: Like(`%${phoneNumber}%`) },
      ],
      order: {
        transactionDate: 'DESC',
      },
    });
  }

  async getHighValueTransactions(
    minAmount: number,
    limit: number = 10,
  ): Promise<SmsTransaction[]> {
    return this.smsTransactionRepository.find({
      where: { amount: MoreThanOrEqual(minAmount) },
      order: {
        amount: 'DESC',
      },
      take: limit,
    });
  }

  async getFailedTransactions(limit: number = 10): Promise<SmsTransaction[]> {
    return this.smsTransactionRepository.find({
      where: { status: TransactionStatus.FAILED },
      order: {
        transactionDate: 'DESC',
      },
      take: limit,
    });
  }

  async updateTransaction(
    id: string,
    updateData: Partial<SmsTransaction>,
  ): Promise<SmsTransaction> {
    const transaction = await this.findOne(id);
    
    Object.assign(transaction, updateData);
    
    return this.smsTransactionRepository.save(transaction);
  }

  async deleteTransaction(id: string): Promise<void> {
    const transaction = await this.findOne(id);
    await this.smsTransactionRepository.remove(transaction);
  }

  async getTransactionCount(): Promise<number> {
    return this.smsTransactionRepository.count();
  }

  async getTransactionCountByType(): Promise<Record<string, number>> {
    const results = await this.smsTransactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.transactionType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('transaction.transactionType')
      .getRawMany();

    return results.reduce((acc, result) => {
      acc[result.type] = parseInt(result.count);
      return acc;
    }, {});
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

  private formatTransactionType(type: string): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private formatTransactionStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
}
