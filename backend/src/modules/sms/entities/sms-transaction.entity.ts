import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TransactionType {
  INCOMING_MONEY = 'incoming_money',
  PAYMENT_TO_CODE_HOLDER = 'payment_to_code_holder',
  TRANSFER_TO_MOBILE = 'transfer_to_mobile',
  BANK_DEPOSIT = 'bank_deposit',
  AIRTIME_BILL_PAYMENT = 'airtime_bill_payment',
  CASH_POWER_BILL_PAYMENT = 'cash_power_bill_payment',
  THIRD_PARTY_TRANSACTION = 'third_party_transaction',
  AGENT_WITHDRAWAL = 'agent_withdrawal',
  BANK_TRANSFER = 'bank_transfer',
  INTERNET_BUNDLE_PURCHASE = 'internet_bundle_purchase',
  VOICE_BUNDLE_PURCHASE = 'voice_bundle_purchase',
  UNKNOWN = 'unknown',
}

export enum TransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('sms_transactions')
export class SmsTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  originalMessage: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.UNKNOWN,
  })
  transactionType: TransactionType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  transactionId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, default: 0 })
  fee: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  senderName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  receiverName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  agentName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  agentPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serviceProvider: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bundleType: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bundleSize: string;

  @Column({ type: 'integer', nullable: true })
  validityDays: number;

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  transactionDate: Date;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.COMPLETED,
  })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
