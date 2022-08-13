import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { DateAudit } from 'src/base/date_audit.entity';
import { Role } from 'src/constant/role.enum';
import { UploadFile } from '../../upload-file/entities/upload-file.entity';

@Entity({ name: 'users' })
export class User extends DateAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ name: 'avatarId', nullable: true })
  avatarId: number;

  @ManyToOne(() => UploadFile, (uploadfile) => uploadfile.id, {
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn({ name: 'avatarId', referencedColumnName: 'id' })
  avatar: UploadFile;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ length: 6, nullable: true })
  OTP: string;

  @Column({ default: true })
  isActive: boolean;

  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
  }

  @Expose()
  get fullName(): string {
    if (this?.firstName && this?.lastName)
      return `${this?.firstName} ${this?.lastName}`;
  }
}
