import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileRepository } from './file.repository';
import { FileEntity } from './entities/file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
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
  controllers: [FileController],
  providers: [FileService, FileRepository],
  exports: [FileRepository, FileService],
})
export class FileModule {}
