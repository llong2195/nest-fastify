import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { QueueService } from './queue.service';

@ApiTags('queue')
@Controller('queue')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Post('transcode')
  transcode() {
    this.queueService.transcode();
  }
}
