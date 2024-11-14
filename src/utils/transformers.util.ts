import { Transform } from 'class-transformer';

/**
 * It converts a string or array of strings into an array of numbers
 */
export const ConvertToArrayOfNumbers = () =>
  Transform(({ value }: { value: any }) => {
    if (value == null || value == undefined) {
      return [];
    }
    return (Array.isArray(value) ? value : (value as string).split(',')).map(
      (i: string) => Number(i),
    );
  });

/**
 * It converts a string to a boolean
 */
export const ConvertToBoolean = () =>
  Transform(({ value }) => {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    if (value === '1' || value == 1 || value == '1') {
      return true;
    }
    if (value === '0' || value == 0 || value == '0') {
      return false;
    }
  });

/**
 * It takes a string and returns a date
 */
export const ConvertToDate = () =>
  Transform(({ value }) => {
    return new Date(value as string | number | Date);
  });

/**
 * ConvertToNumber() is a function that returns a Transform() function that takes a value and returns a
 * Number() of that value.
 */
export const ConvertToNumber = () => Transform(({ value }) => Number(value));
