import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateAudit } from '@base/date_audit.entity';

@Entity({ name: 'files' })
export class FileEntity extends DateAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'origin_url1', type: 'varchar', nullable: true })
  originUrl1: string;

  @Column({ name: 'origin_url2', type: 'varchar', nullable: true })
  originUrl2: string;

  @Column({ name: 'thumb_url', type: 'varchar', nullable: true })
  thumbUrl: string;

  @Column({ name: 'width', type: 'int', nullable: true })
  width: number;

  @Column({ name: 'height', type: 'int', nullable: true })
  height: number;

  @Column({ name: 'size', type: 'int', nullable: true })
  size: number;

  @Column({ name: 'public_id', type: 'varchar', nullable: true })
  publicId: string;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number;

  @Column({ name: 'data', type: 'varchar', nullable: true })
  data: string;

  constructor(partial: Partial<FileEntity>) {
    super();
    Object.assign(this, partial);
  }
}
