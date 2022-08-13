import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  private readonly bcryptSalt: number;

  constructor(
    dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    dataSource.subscribers.push(this);
    this.bcryptSalt = configService.get<number>('bcryptSalt');
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/ban-types
  listenTo(): string | Function {
    return User;
  }

  async beforeInsert(event: InsertEvent<User>): Promise<void> {
    const { password } = event.entity;
    if (password) {
      event.entity.password = await bcrypt.hash(password, this.bcryptSalt);
    }
  }
  async beforeUpdate(event: UpdateEvent<User>): Promise<void> {
    const { password } = event.entity;
    if (password) {
      event.entity.password = await bcrypt.hash(password, this.bcryptSalt);
    }
  }
}
