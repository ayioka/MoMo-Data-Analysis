import { Injectable } from '@nestjs/common';
import { TransactionType, TransactionStatus } from '../entities/sms-transaction.entity';
import * as moment from 'moment';

export interface ParsedSmsData {
  transactionType: TransactionType;
  transactionId?: string;
  amount?: number;
  fee?: number;
  senderName?: string;
  receiverName?: string;
  phoneNumber?: string;
  agentName?: string;
  agentPhone?: string;
  serviceProvider?: string;
  bundleType?: string;
  bundleSize?: string;
  validityDays?: number;
  transactionDate?: Date;
  status: TransactionStatus;
  description?: string;
  metadata?: any;
}

@Injectable()
export class SmsParsingService {
  private readonly patterns = {
    // Incoming Money patterns
    incomingMoney: [
      /You have received (\d+(?:\.\d{2})?)\s*RWF from (.+?)\. Transaction ID: (\w+)\. Date: (.+?)\./i,
      /(\d+(?:\.\d{2})?)\s*RWF received from (.+?)\. TxId: (\w+)\. (.+)/i,
    ],
    
    // Payment to Code Holder patterns
    paymentToCodeHolder: [
      /TxId: (\w+)\. Your payment of (\d+(?:\.\d{2})?)\s*RWF to (.+?) has been completed\. Date: (.+?)\./i,
      /Payment of (\d+(?:\.\d{2})?)\s*RWF to (.+?) completed\. TxId: (\w+)\. (.+)/i,
    ],
    
    // Airtime Bill Payment patterns
    airtimeBillPayment: [
      /\*162\*TxId:(\w+)\*S\*Your payment of (\d+(?:\.\d{2})?)\s*RWF to Airtime has been completed\. Fee: (\d+(?:\.\d{2})?)\s*RWF\. Date: (.+?)\./i,
      /Airtime payment of (\d+(?:\.\d{2})?)\s*RWF completed\. Fee: (\d+(?:\.\d{2})?)\s*RWF\. TxId: (\w+)\. (.+)/i,
    ],
    
    // Agent Withdrawal patterns
    agentWithdrawal: [
      /You (.+?) have via agent: (.+?) \((\d+)\), withdrawn (\d+(?:\.\d{2})?)\s*RWF on (.+?)\./i,
      /Withdrawn (\d+(?:\.\d{2})?)\s*RWF via agent (.+?) on (.+?)\. TxId: (\w+)/i,
    ],
    
    // Internet Bundle Purchase patterns
    bundlePurchase: [
      /Yello! You have purchased an internet bundle of (.+?) for (\d+(?:\.\d{2})?)\s*RWF valid for (\d+) days/i,
      /Internet bundle (.+?) purchased for (\d+(?:\.\d{2})?)\s*RWF\. Valid for (\d+) days/i,
      /Voice bundle (.+?) purchased for (\d+(?:\.\d{2})?)\s*RWF\. Valid for (\d+) days/i,
    ],
    
    // Transfer to Mobile patterns
    transferToMobile: [
      /Transfer of (\d+(?:\.\d{2})?)\s*RWF to (\d+) completed\. TxId: (\w+)\. (.+)/i,
      /Sent (\d+(?:\.\d{2})?)\s*RWF to (\d+)\. TxId: (\w+)\. Date: (.+)/i,
    ],
    
    // Bank Deposit patterns
    bankDeposit: [
      /Bank deposit of (\d+(?:\.\d{2})?)\s*RWF completed\. TxId: (\w+)\. (.+)/i,
      /Deposited (\d+(?:\.\d{2})?)\s*RWF to bank\. TxId: (\w+)\. (.+)/i,
    ],
    
    // Cash Power Bill Payment patterns
    cashPowerBillPayment: [
      /Cash Power payment of (\d+(?:\.\d{2})?)\s*RWF completed\. TxId: (\w+)\. (.+)/i,
      /EUCL payment of (\d+(?:\.\d{2})?)\s*RWF completed\. TxId: (\w+)\. (.+)/i,
    ],
    
    // Third Party Transaction patterns
    thirdPartyTransaction: [
      /Third party transaction of (\d+(?:\.\d{2})?)\s*RWF\. TxId: (\w+)\. (.+)/i,
      /Payment initiated by (.+?)\. Amount: (\d+(?:\.\d{2})?)\s*RWF\. TxId: (\w+)/i,
    ],
    
    // Bank Transfer patterns
    bankTransfer: [
      /Bank transfer of (\d+(?:\.\d{2})?)\s*RWF completed\. TxId: (\w+)\. (.+)/i,
      /Transferred (\d+(?:\.\d{2})?)\s*RWF to bank\. TxId: (\w+)\. (.+)/i,
    ],
    
    // Generic transaction ID pattern
    transactionId: [
      /TxId:?\s*(\w+)/i,
      /Transaction ID:?\s*(\w+)/i,
    ],
    
    // Date patterns
    date: [
      /Date: (.+?)(?:\.|$)/i,
      /on (.+?)(?:\.|$)/i,
      /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/i,
    ],
    
    // Amount patterns
    amount: [
      /(\d+(?:\.\d{2})?)\s*RWF/i,
    ],
    
    // Fee patterns
    fee: [
      /Fee: (\d+(?:\.\d{2})?)\s*RWF/i,
    ],
  };

  parseSmsMessage(message: string): ParsedSmsData {
    const trimmedMessage = message.trim();
    
    // Try to identify transaction type and parse accordingly
    const parsedData: ParsedSmsData = {
      transactionType: TransactionType.UNKNOWN,
      status: TransactionStatus.COMPLETED,
      metadata: {},
    };

    // Check for incoming money
    if (this.isIncomingMoney(trimmedMessage)) {
      return this.parseIncomingMoney(trimmedMessage);
    }
    
    // Check for payment to code holder
    if (this.isPaymentToCodeHolder(trimmedMessage)) {
      return this.parsePaymentToCodeHolder(trimmedMessage);
    }
    
    // Check for airtime bill payment
    if (this.isAirtimeBillPayment(trimmedMessage)) {
      return this.parseAirtimeBillPayment(trimmedMessage);
    }
    
    // Check for agent withdrawal
    if (this.isAgentWithdrawal(trimmedMessage)) {
      return this.parseAgentWithdrawal(trimmedMessage);
    }
    
    // Check for bundle purchase
    if (this.isBundlePurchase(trimmedMessage)) {
      return this.parseBundlePurchase(trimmedMessage);
    }
    
    // Check for transfer to mobile
    if (this.isTransferToMobile(trimmedMessage)) {
      return this.parseTransferToMobile(trimmedMessage);
    }
    
    // Check for bank deposit
    if (this.isBankDeposit(trimmedMessage)) {
      return this.parseBankDeposit(trimmedMessage);
    }
    
    // Check for cash power bill payment
    if (this.isCashPowerBillPayment(trimmedMessage)) {
      return this.parseCashPowerBillPayment(trimmedMessage);
    }
    
    // Check for third party transaction
    if (this.isThirdPartyTransaction(trimmedMessage)) {
      return this.parseThirdPartyTransaction(trimmedMessage);
    }
    
    // Check for bank transfer
    if (this.isBankTransfer(trimmedMessage)) {
      return this.parseBankTransfer(trimmedMessage);
    }
    
    // If no specific pattern matches, try to extract basic information
    return this.parseGenericTransaction(trimmedMessage);
  }

  private isIncomingMoney(message: string): boolean {
    return /received|receive/i.test(message) && /RWF/i.test(message);
  }

  private parseIncomingMoney(message: string): ParsedSmsData {
    const data: ParsedSmsData = {
      transactionType: TransactionType.INCOMING_MONEY,
      status: TransactionStatus.COMPLETED,
    };

    for (const pattern of this.patterns.incomingMoney) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('You have received')) {
          data.amount = parseFloat(match[1]);
          data.senderName = match[2];
          data.transactionId = match[3];
          data.transactionDate = this.parseDate(match[4]);
        } else {
          data.amount = parseFloat(match[1]);
          data.senderName = match[2];
          data.transactionId = match[3];
          data.transactionDate = this.parseDate(match[4]);
        }
        break;
      }
    }

    this.extractGenericFields(message, data);
    return data;
  }

  private isPaymentToCodeHolder(message: string): boolean {
    return /payment.*completed/i.test(message) && /TxId/i.test(message);
  }

  private parsePaymentToCodeHolder(message: string): ParsedSmsData {
    const data: ParsedSmsData = {
      transactionType: TransactionType.PAYMENT_TO_CODE_HOLDER,
      status: TransactionStatus.COMPLETED,
    };

    for (const pattern of this.patterns.paymentToCodeHolder) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('TxId:')) {
          data.transactionId = match[1];
          data.amount = parseFloat(match[2]);
          data.receiverName = match[3];
          data.transactionDate = this.parseDate(match[4]);
        } else {
          data.amount = parseFloat(match[1]);
          data.receiverName = match[2];
          data.transactionId = match[3];
          data.transactionDate = this.parseDate(match[4]);
        }
        break;
      }
    }

    this.extractGenericFields(message, data);
    return data;
  }

  private isAirtimeBillPayment(message: string): boolean {
    return /airtime/i.test(message) && /payment/i.test(message);
  }

  private parseAirtimeBillPayment(message: string): ParsedSmsData {
    const data: ParsedSmsData = {
      transactionType: TransactionType.AIRTIME_BILL_PAYMENT,
      status: TransactionStatus.COMPLETED,
      serviceProvider: 'MTN',
    };

    for (const pattern of this.patterns.airtimeBillPayment) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('*162*')) {
          data.transactionId = match[1];
          data.amount = parseFloat(match[2]);
          data.fee = parseFloat(match[3]);
          data.transactionDate = this.parseDate(match[4]);
        } else {
          data.amount = parseFloat(match[1]);
          data.fee = parseFloat(match[2]);
          data.transactionId = match[3];
          data.transactionDate = this.parseDate(match[4]);
        }
        break;
      }
    }

    this.extractGenericFields(message, data);
    return data;
  }

  private isAgentWithdrawal(message: string): boolean {
    return /withdrawn|withdraw/i.test(message) && /agent/i.test(message);
  }

  private parseAgentWithdrawal(message: string): ParsedSmsData {
    const data: ParsedSmsData = {
      transactionType: TransactionType.AGENT_WITHDRAWAL,
      status: TransactionStatus.COMPLETED,
    };

    for (const pattern of this.patterns.agentWithdrawal) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('You (.+?) have via agent')) {
          data.receiverName = match[1];
          data.agentName = match[2];
          data.agentPhone = match[3];
          data.amount = parseFloat(match[4]);
          data.transactionDate = this.parseDate(match[5]);
        } else {
          data.amount = parseFloat(match[1]);
          data.agentName = match[2];
          data.transactionDate = this.parseDate(match[3]);
          data.transactionId = match[4];
        }
        break;
      }
    }

    this.extractGenericFields(message, data);
    return data;
  }

  private isBundlePurchase(message: string): boolean {
    return /bundle.*purchased|purchased.*bundle/i.test(message) || /Yello!/i.test(message);
  }

  private parseBundlePurchase(message: string): ParsedSmsData {
    const data: ParsedSmsData = {
      transactionType: /internet/i.test(message) 
        ? TransactionType.INTERNET_BUNDLE_PURCHASE 
        : TransactionType.VOICE_BUNDLE_PURCHASE,
      status: TransactionStatus.COMPLETED,
      serviceProvider: 'MTN',
    };

    for (const pattern of this.patterns.bundlePurchase) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('Yello!')) {
          data.bundleSize = match[1];
          data.amount = parseFloat(match[2]);
          data.validityDays = parseInt(match[3]);
          data.bundleType = 'Internet';
        } else {
          data.bundleSize = match[1];
          data.amount = parseFloat(match[2]);
          data.validityDays = parseInt(match[3]);
          data.bundleType = pattern.source.includes('Voice') ? 'Voice' : 'Internet';
        }
        break;
      }
    }

    this.extractGenericFields(message, data);
    return data;
  }

  private isTransferToMobile(message: string): boolean {
    return /transfer.*to|sent.*to/i.test(message) && /\d{9,}/i.test(message);
  }

  private parseTransferToMobile(message: string): ParsedSmsData {
    const data: ParsedSmsData = {
      transactionType: TransactionType.TRANSFER_TO_MOBILE,
      status: TransactionStatus.COMPLETED,
    };

    for (const pattern of this.patterns.transferToMobile) {
      const match = message.match(pattern);
      if (match) {
        data.amount = parseFloat(match[1]);
        data.phoneNumber = match[2];
        data.transactionId = match[3];
        data.transactionDate = this.parseDate(match[4]);
        break;
      }
    }

    this.extractGenericFields(message, data);
    return data;
  }

  private isBankDeposit(message: string): boolean {
    return /bank.*deposit|deposit.*bank/i.test(message);
  }

  private parseBankDeposit(message: string): ParsedSmsData {
    const data: ParsedSmsData = {
      transactionType: TransactionType.BANK_DEPOSIT,
      status: TransactionStatus.COMPLETED,
    };

    for (const pattern of this.patterns.bankDeposit) {
      const match = message.match(pattern);
      if (match) {
        data.amount = parseFloat(match[1]);
        data.transactionId = match[2];
        data.transactionDate = this.parseDate(match[3]);
        break;
      }
    }

    this.extractGenericFields(message, data);
    return data;
  }

  private isCashPowerBillPayment(message: string): boolean {
    return /cash power|EUCL/i.test(message);
  }

  private parseCashPowerBillPayment(message: string): ParsedSmsData {
    const data: ParsedSmsData = {
      transactionType: TransactionType.CASH_POWER_BILL_PAYMENT,
      status: TransactionStatus.COMPLETED,
      serviceProvider: /EUCL/i.test(message) ? 'EUCL' : 'Cash Power',
    };

    for (const pattern of this.patterns.cashPowerBillPayment) {
      const match = message.match(pattern);
      if (match) {
        data.amount = parseFloat(match[1]);
        data.transactionId = match[2];
        data.transactionDate = this.parseDate(match[3]);
        break;
      }
    }

    this.extractGenericFields(message, data);
    return data;
  }

  private isThirdPartyTransaction(message: string): boolean {
    return /third party|initiated by/i.test(message);
  }

  private parseThirdPartyTransaction(message: string): ParsedSmsData {
    const data: ParsedSmsData = {
      transactionType: TransactionType.THIRD_PARTY_TRANSACTION,
      status: TransactionStatus.COMPLETED,
    };

    for (const pattern of this.patterns.thirdPartyTransaction) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('initiated by')) {
          data.senderName = match[1];
          data.amount = parseFloat(match[2]);
          data.transactionId = match[3];
        } else {
          data.amount = parseFloat(match[1]);
          data.transactionId = match[2];
          data.transactionDate = this.parseDate(match[3]);
        }
        break;
      }
    }

    this.extractGenericFields(message, data);
    return data;
  }

  private isBankTransfer(message: string): boolean {
    return /bank transfer|transferred.*bank/i.test(message);
  }

  private parseBankTransfer(message: string): ParsedSmsData {
    const data: ParsedSmsData = {
      transactionType: TransactionType.BANK_TRANSFER,
      status: TransactionStatus.COMPLETED,
    };

    for (const pattern of this.patterns.bankTransfer) {
      const match = message.match(pattern);
      if (match) {
        data.amount = parseFloat(match[1]);
        data.transactionId = match[2];
        data.transactionDate = this.parseDate(match[3]);
        break;
      }
    }

    this.extractGenericFields(message, data);
    return data;
  }

  private parseGenericTransaction(message: string): ParsedSmsData {
    const data: ParsedSmsData = {
      transactionType: TransactionType.UNKNOWN,
      status: TransactionStatus.COMPLETED,
    };

    this.extractGenericFields(message, data);
    return data;
  }

  private extractGenericFields(message: string, data: ParsedSmsData): void {
    // Extract transaction ID if not already found
    if (!data.transactionId) {
      for (const pattern of this.patterns.transactionId) {
        const match = message.match(pattern);
        if (match) {
          data.transactionId = match[1];
          break;
        }
      }
    }

    // Extract amount if not already found
    if (!data.amount) {
      for (const pattern of this.patterns.amount) {
        const match = message.match(pattern);
        if (match) {
          data.amount = parseFloat(match[1]);
          break;
        }
      }
    }

    // Extract fee if not already found
    if (!data.fee) {
      for (const pattern of this.patterns.fee) {
        const match = message.match(pattern);
        if (match) {
          data.fee = parseFloat(match[1]);
          break;
        }
      }
    }

    // Extract date if not already found
    if (!data.transactionDate) {
      for (const pattern of this.patterns.date) {
        const match = message.match(pattern);
        if (match) {
          data.transactionDate = this.parseDate(match[1]);
          break;
        }
      }
    }

    // Set description as the original message
    data.description = message;
  }

  private parseDate(dateString: string): Date | undefined {
    if (!dateString) return undefined;

    // Try different date formats
    const formats = [
      'YYYY-MM-DD HH:mm:ss',
      'YYYY-MM-DD',
      'DD/MM/YYYY HH:mm:ss',
      'DD/MM/YYYY',
      'MM/DD/YYYY HH:mm:ss',
      'MM/DD/YYYY',
    ];

    for (const format of formats) {
      const parsed = moment(dateString.trim(), format, true);
      if (parsed.isValid()) {
        return parsed.toDate();
      }
    }

    // Try natural language parsing
    const naturalParsed = moment(dateString.trim());
    if (naturalParsed.isValid()) {
      return naturalParsed.toDate();
    }

    return undefined;
  }
}
