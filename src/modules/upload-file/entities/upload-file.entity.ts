import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateAudit } from '@base/date_audit.entity';

@Entity({ name: 'upload_files' })
export class UploadFile extends DateAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  originUrl: string;

  @Column({ nullable: true })
  thumbUrl: string;

  @Column({ nullable: true })
  ownerId: string;

  constructor(partial: Partial<UploadFile>) {
    super();
    Object.assign(this, partial);
  }
}
