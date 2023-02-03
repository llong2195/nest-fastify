import {
    BadRequestException,
    Injectable,
    NotFoundException,
    PayloadTooLargeException,
    PipeTransform,
} from '@nestjs/common';
import { ErrorMessageCode } from '@src/constants';

export enum FileType {
    JPEG = 'image/jpeg',
    PNG = 'image/png',
}

export const FILE = {
    ALLOWED_MIME_TYPES: FileType,
    MAX_SIZE: 10 * 1000 * 1000, // 10 MB
};

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
            value.map(file => this.validateFile(file));
        } else {
            this.validateFile(value);
        }
        return value;
    }

    private validateFile(file: Express.Multer.File) {
        if (!file) {
            throw new NotFoundException(ErrorMessageCode.FILE_NOT_FOUND);
        }
        if (!Object.values(this.options.allowedMimetypes).includes(file.mimetype as FileType)) {
            throw new BadRequestException(ErrorMessageCode.INVALID_FILE_FORMAT);
        }
        if (file.size > this.options.maxSize) {
            throw new PayloadTooLargeException(ErrorMessageCode.FILE_TOO_LARGE);
        }
        return file;
    }
}
