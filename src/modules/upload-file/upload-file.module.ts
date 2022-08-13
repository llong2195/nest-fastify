import { Module } from '@nestjs/common';
import { UploadFileService } from './upload-file.service';
import { UploadFileController } from './upload-file.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadFileRepository } from './upload-file.repository';
import { UploadFile } from './entities/upload-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UploadFile])],
  controllers: [UploadFileController],
  providers: [UploadFileService, UploadFileRepository],
})
export class UploadFileModule {}
