import { Module } from '@nestjs/common';
import { UploadFileService } from './upload-file.service';
import { UploadFileController } from './upload-file.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadFileRepository } from './upload-file.repository';
import { UploadFile } from './entities/upload-file.entity';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([UploadFile]),
    // BullModule.registerQueue({
    //   name: 'image',
    //   processors: [
    //     {
    //       name: 'resize',
    //       path: join(__dirname, 'resize.processor.js'),
    //     },
    //   ],
    // }),
  ],
  controllers: [UploadFileController],
  providers: [UploadFileService, UploadFileRepository],
})
export class UploadFileModule {}
