import { ValidationError } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import CryptoJS from 'crypto-js';
import camelCase from 'lodash.camelcase';
import { PassThrough } from 'node:stream';
import QRCode, { QRCodeToFileStreamOptions } from 'qrcode';

import { ValidationConfig } from '@/configs';
import { ValidateError } from '@/exceptions/errors';

/**
 *
 * @returns
 */
export function isDev(): boolean {
  const node_env = process.env.NODE_ENV || 'development';

  return 'development' === node_env;
}

export function isProd(): boolean {
  const node_env = process.env.NODE_ENV || 'development';

  return 'production' === node_env;
}

/**
 *
 * @param env
 * @returns
 */
export function isEnv(env: string): boolean {
  const envSystem = process.env.NODE_ENV || 'development';
  return env === envSystem;
}

/**
 *
 * @param length
 * @returns
 */
export function randomString(length = 10): string {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const lastIndex = characters.length - 1;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * lastIndex));
  }
  return result;
}

/**
 *
 * @returns
 */
export function getFullDate(): string {
  const now = new Date();
  return `${now.getFullYear()}_${now.getMonth()}_${now.getDay()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
}

/**
 *
 * @param str
 * @returns
 */
export const base64Encode = (str: string) => {
  const b = Buffer.from(str);
  return b.toString('base64');
};

/**
 *
 * @param str
 * @returns
 */
export const base64Decode = (str: string) => {
  const b = Buffer.from(str, 'base64');
  return b.toString();
};

/**
 * It takes a string, removes the first and last characters of the string, and returns the result
 * @param {string} str - The string to be trimmed.
 * @param {string} trim_str - The string to trim from the beginning and end of the string.
 */
export const trim = (str: string, trim_str: string): string => {
  const reg = new RegExp(`^${trim_str}+|${trim_str}+$`, 'gm');
  const replacedStr = str.replace(reg, '');

  return camelCase(replacedStr);
};

/**
 *
 * @param str
 * @returns
 */
export const toSnakeCase = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

/**
 *
 * @param min
 * @param max
 * @returns
 */
export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 *
 * @param second
 * @returns
 */
export const currentTimestamp = (second = true): number => {
  if (second) {
    return Math.round(Date.now() / 1000);
  }
  return Date.now();
};

/**
 *
 * @param a
 * @returns
 */
export function uniq<T>(a: T[]): T[] {
  return Array.from(new Set(a));
}

/**
 *
 * @param ms
 * @returns
 */
export const sleep = async (ms: number): Promise<unknown> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 *
 * @param text
 * @param size
 * @param qualityLevel
 * @returns
 */
export const generateQR = async (
  text: string,
  size = 108,
  qualityLevel = 'M',
) => {
  // const qrStream = await QRCode.toDataURL(text, { //errorCorrectionLevel: 'L', version: 8 })
  const qrStream = new PassThrough();
  await QRCode.toFileStream(qrStream, text, {
    // type: 'png',
    width: size,
    errorCorrectionLevel: qualityLevel,
  } as QRCodeToFileStreamOptions);
  // console.log(text, url, qrStream)
  return qrStream;
};

export const encryptObj = (obj: any, secretKey: string): string => {
  // return CryptoJS.AES.encrypt(JSON.stringify(obj), secretKey).toString();
  const encJson = CryptoJS.AES.encrypt(
    JSON.stringify(obj),
    secretKey,
  ).toString();
  const encData = CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(encJson),
  );
  return encData;
};

export const decryptObj = (encryptText: string, secretKey: string): unknown => {
  // const bytes = CryptoJS.AES.decrypt(encryptText, secretKey);
  // return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  const decData = CryptoJS.enc.Base64.parse(encryptText).toString(
    CryptoJS.enc.Utf8,
  );
  const bytes = CryptoJS.AES.decrypt(decData, secretKey).toString(
    CryptoJS.enc.Utf8,
  );
  return JSON.parse(bytes);
};

/**
 * Converts an object to a Map<string, string>.
 *
 * @param obj - The object to be converted.
 * @returns The resulting Map<string, string>.
 */
export const objectToMap = (
  obj: Record<string, string | object>,
): Map<string, string> => {
  const map = new Map<string, string>();
  const stack = [{ obj, prefix: '' }];
  while (stack.length > 0) {
    const popData = stack.pop();
    if (!popData) {
      continue;
    }
    const { obj, prefix } = popData;
    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        if (Array.isArray(obj[key])) {
          obj[key].forEach((item: object, index: number) => {
            stack.push({
              obj: item as Record<string, string | object>,
              prefix: `${prefix}${key}.${index}.`,
            });
          });
        } else {
          stack.push({
            obj: obj[key] as Record<string, string | object>,
            prefix: `${prefix}${key}.`,
          });
        }
      } else if (!Array.isArray(obj[key])) {
        map.set(`${prefix}${key}`, String(obj[key]));
      }
    }
  }
  return map;
};

export const validateDto = async <T>(
  data: unknown,
  cls: ClassConstructor<T>,
): Promise<T> => {
  const obj = plainToInstance(cls, data);
  const options = ValidationConfig;
  const errors = await validate(obj as object, options);
  if (errors.length > 0) {
    function flattenValidationErrors(
      validationErrors: ValidationError[],
    ): string[] {
      return validationErrors
        .map((error) => mapChildrenToValidationErrors(error))
        .flat()
        .filter((item) => !!item.constraints)
        .map((item) =>
          item.constraints ? Object.values(item.constraints) : [],
        )
        .flat();
    }

    function mapChildrenToValidationErrors(
      error: ValidationError,
      parentPath?: string,
    ): ValidationError[] {
      if (!(error.children && error.children.length)) {
        return [error];
      }
      const validationErrors: ValidationError[] = [];
      parentPath = parentPath
        ? `${parentPath}.${error.property}`
        : error.property;
      for (const item of error.children) {
        if (item.children && item.children.length) {
          validationErrors.push(
            ...mapChildrenToValidationErrors(item, parentPath),
          );
        }
        validationErrors.push(
          prependConstraintsWithParentProp(parentPath, item),
        );
      }
      return validationErrors;
    }

    function prependConstraintsWithParentProp(
      parentPath: string,
      error: ValidationError,
    ): ValidationError {
      const constraints: { [key: string]: string } = {};
      for (const key in error.constraints) {
        constraints[key] = `${parentPath}.${error.constraints[key]}`;
      }
      return {
        ...error,
        constraints,
      };
    }

    const errorMessages = flattenValidationErrors(errors).join('; ');
    throw new ValidateError(errorMessages);
  }
  return obj;
};
