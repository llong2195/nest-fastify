import { Transform } from 'class-transformer';

export const ConvertToArrayOfNumbers = () =>
  Transform((params) => {
    const values = params.value;
    if (!values) {
      return [];
    }
    return (Array.isArray(values) ? values : values.split(',')).map((value: string) => Number(value));
  });

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

export const ConvertToDate = () =>
  Transform(({ value }) => {
    return new Date(value);
  });

export const ConvertToNumber = () => Transform(({ value }) => Number(value));
