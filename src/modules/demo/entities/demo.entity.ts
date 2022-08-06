import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateAudit } from '../../../common/base/date_audit.entity';

@Entity({ name: 'demo' })
export class Demo extends DateAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'title', nullable: true })
  title: string;

  @Column({ name: 'description', nullable: true })
  description: string;

  @Column({ type: 'longtext', nullable: true })
  content: string;

  @Column({ name: 'mediaId', nullable: true })
  mediaId: number;

  @Column({ default: 0, nullable: true })
  numSeen: number;

  @Column({ default: 0, nullable: true })
  numLike: number;

  @Column({ default: 0, nullable: true })
  numComment: number;

  @Column({ name: 'onwerId', nullable: true })
  onwerId: number;

  constructor(partial: Partial<Demo>) {
    super();
    Object.assign(this, partial);
  }
}
