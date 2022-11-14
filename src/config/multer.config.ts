import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { MAX_FILE_SIZE } from './index';
import { UPLOAD_LOCATION } from './config';
import { getFullDate } from 'src/util/util';

// Multer configuration
export const multerConfig = {
  dest: UPLOAD_LOCATION || './public/upload',
};

// Multer upload options
export const multerOptions: MulterOptions = {
  // Enable file size limits
  limits: {
    fileSize: MAX_FILE_SIZE || 50 * 8 * 1024 * 1024,
  },
  // Check the mimetypes to allow for upload
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/) || file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      // Allow storage of file
      cb(null, true);
    } else {
      // Reject file
      cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
    }
  },
  // Storage properties
  storage: diskStorage({
    // Destination storage path details
    destination: (req: any, file: any, cb: any) => {
      const uploadPath = multerConfig.dest;
      // Create folder if it doesn't exist
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath);
      }
      cb(null, uploadPath);
    },
    // File modification details
    filename: (req: any, file: any, cb: any) => {
      // Calling the callback passing the random name generated with the original extension name
      cb(null, `${getFullDate()}-${file.originalname}`);
    },
  }),
};

// Multer upload options
export const multerVideoOptions: MulterOptions = {
  // Enable file size limits
  limits: {
    fileSize: MAX_FILE_SIZE || 500 * 8 * 1024 * 1024,
  },
  // Check the mimetypes to allow for upload
  fileFilter: (req: any, file: any, cb: any) => {
    if (
      file.mimetype.match(/\/(gif|mp4|ogg|wmv|mkv|mov)$/) ||
      file.originalname.match(/\.(gif|mp4|ogg|wmv|mkv|mov)$/)
    ) {
      // Allow storage of file
      cb(null, true);
    } else {
      // Reject file
      cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
    }
  },
  // Storage properties
  storage: diskStorage({
    // Destination storage path details
    destination: (req: any, file: any, cb: any) => {
      const uploadPath = multerConfig.dest;
      // Create folder if it doesn't exist
      if (!existsSync(uploadPath)) {
        mkdirSync(uploadPath);
      }
      cb(null, uploadPath);
    },
    // File modification details
    filename: (req: any, file: any, cb: any) => {
      // Calling the callback passing the random name generated with the original extension name
      cb(null, `${getFullDate()}-${file.originalname}`);
    },
  }),
};
