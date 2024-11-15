import { Transform } from 'class-transformer';

/**
 * It converts a string or array of strings
 */
export const ConvertToArray = (separator?: string) =>
  Transform(({ value }: { value: string | string[] }) => {
    separator = separator || ',';
    const values: string | string[] = value;
    if (values == null || values == undefined) {
      return [];
    }
    return Array.isArray(values)
      ? values
      : typeof values == 'string'
        ? values.split(separator)
        : [values];
  });

/**
 * It converts a string or array of strings into an array of numbers
 */
export const ConvertToArrayOfNumbers = () =>
  Transform(({ value }: { value: string | string[] }) => {
    const values = value;

    if (values == null || values == undefined) {
      return [];
    }

    return (
      Array.isArray(values)
        ? values
        : typeof values == 'string'
          ? values.split(',')
          : [values]
    )
      .map((value: string) => Number(value))
      .filter((value: number) => !isNaN(value));
  });

/**
 * It converts a string to a boolean
 */
export const ConvertToBoolean = () =>
  Transform(({ value }) => {
    if (value === 'true' || value === '1' || value == 1) {
      return true;
    }
    if (value === 'false' || value === '0' || value == 0) {
      return false;
    }
    return Boolean(value);
  });
