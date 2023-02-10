import { Transform } from 'class-transformer';

/**
 * It converts a string or array of strings into an array of numbers
 */
export const ConvertToArrayOfNumbers = () =>
    Transform(params => {
        const values = params.value;
        if (!values) {
            return [];
        }
        return (Array.isArray(values) ? values : values.split(',')).map((value: string) => Number(value));
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
        return new Date(value);
    });

/**
 * ConvertToNumber() is a function that returns a Transform() function that takes a value and returns a
 * Number() of that value.
 */
export const ConvertToNumber = () => Transform(({ value }) => Number(value));
