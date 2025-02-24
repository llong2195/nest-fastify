import { ClassConstructor } from 'class-transformer';
import { FastifyRequest } from 'fastify';
import { lookup } from 'mime-types';

import { ByteSize } from '@/common/constants/app.constants';
import { FastifyMultipartBaseOptions, MultipartFile } from '@fastify/multipart';

import { validateDto } from './util';

export type UploadFileOption = {
  fieldName?: string;
  contentTypes?: string[];
  /**
   * Max field value size (in bytes)
   * @default 1MB || ByteSize.MB
   */
  maxSize?: number;
  /**
   * Max number of files
   * @default 1
   */
  files?: number;
};

/**
 * File helper class
 */
export class FileHelper {
  private static validateFileOptions(
    options?: UploadFileOption,
  ): FastifyMultipartBaseOptions {
    const _fileSize = options?.maxSize || 1 * ByteSize.MB;
    const _limitFiles = options?.files || 1;
    const _fieldName = options?.fieldName || 'file';
    const _contentTypes = options?.contentTypes || [];
    return {
      limits: {
        files: _limitFiles,
        fileSize: _fileSize,
      },
      isPartAFile: (
        fieldName?: string,
        contentType?: string,
        fileName?: string,
      ) => {
        if (fieldName !== _fieldName) {
          return false;
        }
        if (_contentTypes) {
          const types = _contentTypes.map((i) => lookup(i)).join('|');
          const regxContentType = new RegExp(`(${types})$`);
          const regxMineType = new RegExp(`(${_contentTypes.join('|')})$`);
          return Boolean(
            contentType?.match(regxContentType) ||
              fileName?.match(regxMineType),
          );
        } else {
          return true;
        }
      },
    };
  }

  static validateFile(req: FastifyRequest, options?: UploadFileOption) {
    const validateFile = this.validateFileOptions(options);
    return req.file(validateFile);
  }

  static validateFiles(req: FastifyRequest, options?: UploadFileOption) {
    const validateFile = this.validateFileOptions(options);
    return req.files(validateFile);
  }

  static async validateFormData<T>(
    req: FastifyRequest,
    options?: UploadFileOption,
    cls?: ClassConstructor<T>,
  ): Promise<{ file: MultipartFile | undefined; body: T }> {
    const validateFile = this.validateFileOptions(options);

    const mergeObjectValue = (
      root: { [key: string]: unknown },
      key: string,
      value: unknown,
    ) => {
      if (root[key] === undefined) {
        body[key] = value;
      } else if (Array.isArray(body[key])) {
        body[key].push(value);
      } else {
        body[key] = [body[key], value];
      }
    };

    const parts = req.parts(validateFile);

    let file: MultipartFile | undefined = undefined;
    const body: { [key: string]: unknown } = {};
    for await (const part of parts) {
      if (part.type === 'file') {
        await part.toBuffer();
        file = part;
      } else {
        mergeObjectValue(body, part.fieldname, part.value);
      }
    }

    return {
      file,
      body: cls ? await validateDto<T>(body, cls) : (body as T),
    };
  }
}
