import { describe, it, expect } from 'vitest';
import { AppOracleError } from '../src';

describe('AppOracleError', () => {
  it('should create error with message and code', () => {
    const error = new AppOracleError('Test error', 'TEST_CODE');
    
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('AppOracleError');
  });

  it('should identify validation errors', () => {
    const error = new AppOracleError('Invalid input', 'VALIDATION_ERROR');
    expect(error.isValidationError()).toBe(true);
  });

  it('should identify auth errors', () => {
    const error = new AppOracleError('Unauthorized', 'AUTH_ERROR', 401);
    expect(error.isAuthError()).toBe(true);
  });

  it('should identify server errors', () => {
    const error = new AppOracleError('Server error', 'SERVER_ERROR', 500);
    expect(error.isServerError()).toBe(true);
  });
});
