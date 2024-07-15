import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { BaseResponseDto } from '@/base/base.dto';
import { NodemailerService } from './nodemailer.service';

@ApiTags('nodemailer')
@Controller('nodemailer')
export class NodemailerController {
  constructor(private readonly nodemailerService: NodemailerService) {}

  @Get()
  async test(): Promise<BaseResponseDto<any>> {
    await this.nodemailerService.example();
    return new BaseResponseDto<any>();
  }

  @Get('queue')
  async queue(): Promise<BaseResponseDto<any>> {
    await this.nodemailerService.sendMailwithQueue('data');
    return new BaseResponseDto<any>();
  }
}
