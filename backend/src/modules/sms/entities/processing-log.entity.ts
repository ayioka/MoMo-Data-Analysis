import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ProcessingStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  PARTIAL = 'partial',
}

@Entity('processing_logs')
export class ProcessingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'text' })
  originalMessage: string;

  @Column({
    type: 'enum',
    enum: ProcessingStatus,
  })
  processingStatus: ProcessingStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'json', nullable: true })
  extractedData: any;

  @Column({ type: 'varchar', length: 255, nullable: true })
  uploadBatchId: string;

  @CreateDateColumn()
  createdAt: Date;
}
