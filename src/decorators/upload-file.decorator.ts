import { FastifyMultipartBaseOptions, MultipartFile } from '@fastify/multipart';
import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { ClassConstructor } from 'class-transformer';
import { FastifyRequest } from 'fastify';
import { lookup } from 'mime-types';

import { ByteSize } from '@/constants/app.constants';
import { ValidateError } from '@/exceptions/errors';
import { validateDto } from '@/utils';

type UploadFileOption = {
  fieldName?: string;
  contentTypes?: string[];
  /**
   * Max field value size (in bytes)
   * @default 1MB || ByteSize.MB
   */
  maxSize?: number;
};

const validateFileOptions = (
  options?: UploadFileOption,
): FastifyMultipartBaseOptions => {
  const _fileSize = options?.maxSize || 1 * ByteSize.MB;
  const _fieldName = options?.fieldName || 'file';
  const _contentTypes = options?.contentTypes || [];
  return {
    limits: {
      files: 1,
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
          contentType?.match(regxContentType) || fileName?.match(regxMineType),
        );
      } else {
        return true;
      }
    },
  };
};

export const UploadedFile = createParamDecorator(
  async (_data: UploadFileOption, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    const validateFile = validateFileOptions(_data);
    const file = await req.file(validateFile);
    if (file == undefined) {
      throw new ValidateError('FILE_INVALID');
    }
    return file;
  },
);

export type UploadedFormDataBody<T> = {
  file: MultipartFile | undefined;
  body: T;
};

export type UploadedFormDataBodyOption = {
  cls?: ClassConstructor<any>;
} & UploadFileOption;

export const UploadedFormData = createParamDecorator(
  async (_data: UploadedFormDataBodyOption, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    const validateFile = validateFileOptions(_data);

    const mergeObjectValue = (
      root: { [key: string]: any },
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
    const body: Record<string, any> = {};
    for await (const part of parts) {
      if (part.type === 'file') {
        await part.toBuffer();
        file = part;
      } else {
        mergeObjectValue(body, part.fieldname, part.value);
      }
    }

    const _body: unknown = _data?.cls
      ? await validateDto(body, _data.cls)
      : body;
    return {
      file,
      body: _body,
    };
  },
);
