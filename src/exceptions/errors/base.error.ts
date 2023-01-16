export class BaseError extends Error {
    protected cause: string | Record<string, unknown>;
    protected errorCode: number;

    /**
     * @param {string} message
     * @param {string | Record<string, unknown>} cause
     * @param {number} errorCode
     */
    constructor(message: string, cause: string | Record<string, unknown>, errorCode: number) {
        super(message);

        this.cause = cause;
        this.errorCode = errorCode;
    }

    /**
     * @returns {string | Record<string, unknown>}
     */
    getCause(): string | Record<string, unknown> {
        return this.cause;
    }

    /**
     * @returns {number}
     */
    getErrorCode(): number {
        return this.errorCode;
    }

    /**
     * @returns {number}
     */
    getMessage(): string {
        return this.message;
    }
}
