import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { DateAudit } from 'src/base/date_audit.entity';
import { Role } from 'src/constant/role.enum';

@Entity({ name: 'users' })
export class UserEntity extends DateAudit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  email: string;

  @JoinColumn({ name: 'avatar' })
  avatar: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ length: 6, nullable: true })
  OTP: string;

  @Column({ default: Role.USER })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  constructor(partial: Partial<UserEntity>) {
    super();
    Object.assign(this, partial);
  }

  @Expose()
  get fullName(): string {
    if (this?.firstName && this?.lastName) return `${this?.firstName} ${this?.lastName}`;
  }
}
