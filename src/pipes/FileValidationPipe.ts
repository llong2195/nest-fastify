import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  PipeTransform,
} from '@nestjs/common';
import { FILE, FileType } from '@src/constant/file.enum';
import { ErrorCode } from '@src/constant/errorCode.enum';

interface ValidatorOptions {
  allowedMimetypes: FileType[];
  maxSize: number;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private options: ValidatorOptions;

  constructor(options?: Partial<ValidatorOptions>) {
    this.options = {
      allowedMimetypes: options?.allowedMimetypes || Object.values(FILE.ALLOWED_MIME_TYPES),
      maxSize: options?.maxSize || FILE.MAX_SIZE,
    };
  }

  transform(value: Express.Multer.File | Express.Multer.File[]) {
    if (Array.isArray(value)) {
      value.map((file) => this.validateFile(file));
    } else {
      this.validateFile(value);
    }
    return value;
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException(ErrorCode.FILE_NOT_FOUND);
    }
    if (!Object.values(this.options.allowedMimetypes).includes(file.mimetype as FileType)) {
      throw new BadRequestException(ErrorCode.INVALID_FILE_FORMAT);
    }
    if (file.size > this.options.maxSize) {
      throw new PayloadTooLargeException(ErrorCode.FILE_TOO_LARGE);
    }
    return file;
  }
}
