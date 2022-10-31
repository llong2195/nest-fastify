import { Controller, Get, NotFoundException, Param, Res, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { join } from 'path';
import fs, { createReadStream } from 'fs';
import { UPLOAD_LOCATION } from '@src/config';
import { Response } from 'express';

@ApiTags('/')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('v1/image/download/:path')
  async GetImage(@Param('path') path: string): Promise<StreamableFile> {
    const filePath = join(process.cwd(), UPLOAD_LOCATION, path);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException();
    }
    const file = createReadStream(filePath);

    return new StreamableFile(file);
  }

  @Get('v1/image/read/:path')
  async readImage(@Param('path') path: string, @Res() res: Response) {
    const filePath = join(process.cwd(), UPLOAD_LOCATION, path);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException();
    }
    console.log(filePath);
    const file = createReadStream(filePath);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    file.pipe(res);
  }
}
