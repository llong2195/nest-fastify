import { Module } from '@nestjs/common';
import { UnitOfWorkService } from './unit-of-work.service';

// Module : DEV
@Module({
  providers: [UnitOfWorkService],
  exports: [UnitOfWorkService],
})
export class TransactionModule {}
