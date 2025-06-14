import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SmsTransactionService } from '../services/sms-transaction.service';
import { TransactionFilterDto } from '../dto/query.dto';
import { PaginatedResponseDto } from '../dto/response.dto';
import { SmsTransaction, TransactionType } from '../entities/sms-transaction.entity';

@ApiTags('SMS Transactions')
@Controller('sms/transactions')
export class SmsTransactionController {
  constructor(
    private readonly smsTransactionService: SmsTransactionService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all transactions with filtering and pagination',
    description: 'Retrieve SMS transactions with advanced filtering, search, and pagination capabilities'
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
    type: PaginatedResponseDto,
  })
  async findAll(@Query() filterDto: TransactionFilterDto): Promise<PaginatedResponseDto<SmsTransaction>> {
    return this.smsTransactionService.findAll(filterDto);
  }

  @Get('types')
  @ApiOperation({ 
    summary: 'Get all transaction types',
    description: 'Retrieve all available transaction types with their labels'
  })
  async getTransactionTypes() {
    return this.smsTransactionService.getTransactionTypes();
  }

  @Get('statuses')
  @ApiOperation({ 
    summary: 'Get all transaction statuses',
    description: 'Retrieve all available transaction statuses with their labels'
  })
  async getTransactionStatuses() {
    return this.smsTransactionService.getTransactionStatuses();
  }

  @Get('recent')
  @ApiOperation({ 
    summary: 'Get recent transactions',
    description: 'Retrieve the most recent transactions'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of transactions to return' })
  async getRecentTransactions(@Query('limit') limit?: number) {
    return this.smsTransactionService.getRecentTransactions(limit || 10);
  }

  @Get('search')
  @ApiOperation({ 
    summary: 'Search transactions',
    description: 'Search transactions by various fields'
  })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search term' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results to return' })
  async searchTransactions(
    @Query('q') searchTerm: string,
    @Query('limit') limit?: number,
  ) {
    return this.smsTransactionService.searchTransactions(searchTerm, limit || 10);
  }

  @Get('high-value')
  @ApiOperation({ 
    summary: 'Get high-value transactions',
    description: 'Retrieve transactions above a specified amount threshold'
  })
  @ApiQuery({ name: 'minAmount', required: true, type: Number, description: 'Minimum amount threshold' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of transactions to return' })
  async getHighValueTransactions(
    @Query('minAmount') minAmount: number,
    @Query('limit') limit?: number,
  ) {
    return this.smsTransactionService.getHighValueTransactions(minAmount, limit || 10);
  }

  @Get('failed')
  @ApiOperation({ 
    summary: 'Get failed transactions',
    description: 'Retrieve transactions with failed status'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of transactions to return' })
  async getFailedTransactions(@Query('limit') limit?: number) {
    return this.smsTransactionService.getFailedTransactions(limit || 10);
  }

  @Get('by-type/:type')
  @ApiOperation({ 
    summary: 'Get transactions by type',
    description: 'Retrieve transactions filtered by transaction type'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of transactions to return' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of transactions to skip' })
  async getTransactionsByType(
    @Param('type') type: TransactionType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.smsTransactionService.getTransactionsByType(
      type,
      limit || 10,
      offset || 0,
    );
  }

  @Get('by-agent/:agentName')
  @ApiOperation({ 
    summary: 'Get transactions by agent',
    description: 'Retrieve transactions associated with a specific agent'
  })
  async getTransactionsByAgent(@Param('agentName') agentName: string) {
    return this.smsTransactionService.getTransactionsByAgent(agentName);
  }

  @Get('by-phone/:phoneNumber')
  @ApiOperation({ 
    summary: 'Get transactions by phone number',
    description: 'Retrieve transactions associated with a specific phone number'
  })
  async getTransactionsByPhoneNumber(@Param('phoneNumber') phoneNumber: string) {
    return this.smsTransactionService.getTransactionsByPhoneNumber(phoneNumber);
  }

  @Get('count')
  @ApiOperation({ 
    summary: 'Get total transaction count',
    description: 'Retrieve the total number of transactions in the system'
  })
  async getTransactionCount() {
    const count = await this.smsTransactionService.getTransactionCount();
    return { totalTransactions: count };
  }

  @Get('count-by-type')
  @ApiOperation({ 
    summary: 'Get transaction count by type',
    description: 'Retrieve transaction counts grouped by transaction type'
  })
  async getTransactionCountByType() {
    return this.smsTransactionService.getTransactionCountByType();
  }

  @Get('transaction-id/:transactionId')
  @ApiOperation({ 
    summary: 'Get transaction by transaction ID',
    description: 'Retrieve a specific transaction using its transaction ID'
  })
  async findByTransactionId(@Param('transactionId') transactionId: string) {
    return this.smsTransactionService.findByTransactionId(transactionId);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get transaction by ID',
    description: 'Retrieve a specific transaction by its UUID'
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.smsTransactionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update transaction',
    description: 'Update specific fields of a transaction'
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<SmsTransaction>,
  ) {
    return this.smsTransactionService.updateTransaction(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete transaction',
    description: 'Delete a specific transaction by its UUID'
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.smsTransactionService.deleteTransaction(id);
    return { message: 'Transaction deleted successfully' };
  }
}
