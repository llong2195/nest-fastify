import { QueryFailedError, TypeORMError } from 'typeorm';
import { sleep } from './util';

export class TypeOrmHelper {
  // https://github.com/typeorm/typeorm/blob/master/src/query-builder/ReturningResultsEntityUpdator.ts#L89
  // https://github.com/typeorm/typeorm/blob/master/src/query-builder/ReturningResultsEntityUpdator.ts#L217
  static readonly TypeOrmErrorUpsert =
    'Cannot update entity because entity id is not set in the entity.';
  static readonly DeadlockErrorCode = 'ER_LOCK_DEADLOCK';
  static readonly DeadlockErrorNo = 1213;
  static readonly DeadlockSqlState = '40001';
  static readonly DeadlockErrorMessage =
    'Deadlock found when trying to get lock; try restarting transaction';

  /**
   * Executes a query function with automatic retry when deadlocks are detected.
   *
   * @param queryFunction - The async function to execute that may encounter deadlocks
   * @param retries - Maximum number of retry attempts (default: 3)
   * @param sleepTime - Time to wait between retries in milliseconds (default: 1000)
   * @returns The result of the queryFunction execution
   * @throws Rethrows any non-deadlock errors immediately, or after all retries are exhausted
   */
  static async executeWithRetryOnDeadlock<T>(
    queryFunction: () => Promise<T>,
    retries = 3,
    sleepTime = 1000,
  ): Promise<T | undefined> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await queryFunction();
      } catch (error) {
        const isDeadlock =
          error instanceof QueryFailedError &&
          this.isDeadlockError(error.driverError as any);

        if (!isDeadlock || attempt === retries) {
          throw error; // Rethrow if not deadlock or final attempt
        }

        await sleep(sleepTime);
      }
    }
  }

  /**
   * Checks if the given MySQL driver error is a deadlock error.
   *
   * @param driverError - MySQL driver error to check
   * @returns True if the error is a deadlock error, false otherwise
   * @private
   */
  private static isDeadlockError(driverError: any): boolean {
    return (
      driverError?.code === this.DeadlockErrorCode ||
      driverError?.errno === this.DeadlockErrorNo ||
      driverError?.sqlState === this.DeadlockSqlState ||
      driverError?.sqlMessage === this.DeadlockErrorMessage
    );
  }

  /**
   * Handles exceptions specifically for upsert operations in TypeORM.
   * Catches and suppresses the TypeORMError with a specific upsert error message,
   * and re-throws any other errors.
   *
   * @param error - The error caught during an upsert operation
   * @throws Will re-throw any error that is not a TypeORMError with the expected upsert message
   * @static
   */
  static handleCatchUpsert(error: unknown) {
    if (
      !(
        error instanceof TypeORMError &&
        error.message == TypeOrmHelper.TypeOrmErrorUpsert
      )
    ) {
      throw error;
    }
  }

  /**
   * Executes the provided Promise callback, handling any potential errors during upsert operations.
   * This method wraps upsert operations to provide standardized error handling.
   *
   * @template T - The type of the value that the Promise resolves to
   * @param {Promise<T>} callback - The Promise to execute, typically representing an upsert operation
   * @returns {Promise<T | undefined>} The result of the callback if successful, undefined if an error occurs
   * @throws {Error} Re-throws or handles specific errors via handleCatchUpsert method
   */
  static async warpUpsert<T>(callback: Promise<T>) {
    try {
      return await callback;
    } catch (error) {
      this.handleCatchUpsert(error);
    }
  }

  /**
   * It takes a string, removes the first and last characters of the string, and returns the result
   * @param {string} str - The string to be trimmed.
   * @param {string} trim_str - The string to trim from the beginning and end of the string.
   */
  static trim(str: string, trim_str: string) {
    const reg = new RegExp(`^${trim_str}+|${trim_str}+$`, 'gm');
    return this.toCamelCase(str.replace(reg, ''));
  }

  /**
   *
   * @param str
   * @returns
   * @link https://github.com/typeorm/typeorm/blob/e7649d2746f907ff36b1efb600402dedd5f5a499/src/util/StringUtils.ts#L20
   */
  static toSnakeCase(str: string): string {
    return (
      str
        // ABc -> a_bc
        .replace(/([A-Z])([A-Z])([a-z])/g, '$1_$2$3')
        // aC -> a_c
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .toLowerCase()
    );
  }

  /**
   *
   * @param str
   * @param firstCapital
   * @returns
   * @link https://github.com/typeorm/typeorm/blob/e7649d2746f907ff36b1efb600402dedd5f5a499/src/util/StringUtils.ts#L8
   */
  static toCamelCase(str: string, firstCapital = false): string {
    if (firstCapital) str = ' ' + str;
    return str.replace(/^([A-Z])|[\s-_](\w)/g, function (match, p1, p2) {
      if (p2) return p2.toUpperCase();
      return p1.toLowerCase();
    });
  }

  /**
   * Transforms an array of database records into an array of entity objects by removing table name prefixes from keys.
   *
   * @template T - The target entity type
   * @param data - Array of database records with table name prefixed keys
   * @param tableName - The name of the database table (used to remove prefix from keys)
   * @returns Array of transformed entity objects of type T
   *
   * @example
   * // If tableName is "user" and data contains [{user_id: 1, user_name: "John"}]
   * // Returns [{id: 1, name: "John"}]
   */
  static tranformToEntity<T>(
    data: Record<string, unknown>[],
    tableName: string,
  ): T[] {
    const prefix = tableName + '_';

    return data.map((item) => {
      const a: Record<string, unknown> = {};

      Object.keys(item).forEach((key) => {
        a[this.trim(key, prefix)] = item[key];
      });

      return a as T;
    });
  }
}
