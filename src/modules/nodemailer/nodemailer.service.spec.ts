import { BullModule } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';

import { NodemailerService } from './nodemailer.service';
import { QueueEnum } from '../../enums/queue.enum';

describe('NodemailerService', () => {
  let service: NodemailerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.registerQueue({
          name: QueueEnum.EMAIL_QUEUE,
        }),
      ],
      providers: [NodemailerService],
    }).compile();

    service = module.get<NodemailerService>(NodemailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
