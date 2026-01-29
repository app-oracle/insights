/**
 * Custom error class for App Oracle SDK
 */
export class AppOracleError extends Error {
  public readonly code?: string;
  public readonly statusCode?: number;

  constructor(message: string, code?: string, statusCode?: number) {
    super(message);
    this.name = 'AppOracleError';
    this.code = code;
    this.statusCode = statusCode;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppOracleError);
    }
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR';
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(): boolean {
    return this.code === 'AUTH_ERROR' || this.statusCode === 401;
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR';
  }

  /**
   * Check if error is a server error
   */
  isServerError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 500;
  }
}
