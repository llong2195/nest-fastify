import { Controller, Get } from '@nestjs/common';
import { NodemailerService } from './nodemailer.service';
import { BaseResponseDto } from '@base/base.dto';
import { ApiTags } from '@nestjs/swagger';

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
