import { Test, TestingModule } from '@nestjs/testing';
import { NodemailerController } from './nodemailer.controller';
import { NodemailerService } from './nodemailer.service';

describe('NodemailerController', () => {
  let controller: NodemailerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NodemailerController],
      providers: [NodemailerService],
    }).compile();

    controller = module.get<NodemailerController>(NodemailerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
