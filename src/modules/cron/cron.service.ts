import { Injectable, Logger } from '@nestjs/common';
import {
  Cron,
  CronExpression,
  Interval,
  SchedulerRegistry,
} from '@nestjs/schedule';
import { exec } from 'child_process';

@Injectable()
export class CronService {
  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}
  private readonly logger = new Logger(CronService.name);

  @Interval(1000000)
  handleInterval(): void {
    this.logger.debug('Called every 1000 seconds');
    this.schedulerRegistry.getCronJobs().forEach((job, key) => {
      console.log(`${key} - ${job.running}`);
      if (!job.running) {
        this.schedulerRegistry.deleteCronJob(key);
      }
    });
  }

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  backupDb(): void {
    exec(
      `mysqldump -u ${process.env.DATABASE_USERNAME} -p${process.env.DATABASE_PASSWORD} ${process.env.DATABASE_DB_NAME} > ${process.env.DATABASE_DB_NAME}.sql`,
      (err, out, derr) => {
        // console.error(err)
        // console.log(out)
        // console.log(derr)
      },
    );
  }
}
