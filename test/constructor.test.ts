import { describe, it, expect } from 'vitest';
import { AppOracleSDK, AppOracleError } from '../src';

const TEST_BASE_URL = 'https://us-central1-app-oracle-b7156.cloudfunctions.net';

describe('AppOracleSDK - Constructor', () => {
  it('should create an instance with valid config', () => {
    const sdk = new AppOracleSDK({
      apiKey: 'test-api-key',
    });

    expect(sdk).toBeInstanceOf(AppOracleSDK);
    expect(sdk.getConfig()).toEqual({
      baseUrl: TEST_BASE_URL,
      timeout: 10000,
    });
  });

  it('should accept custom baseUrl and timeout', () => {
    const sdk = new AppOracleSDK({
      apiKey: 'test-api-key',
      baseUrl: 'https://custom.example.com',
      timeout: 5000,
    });

    expect(sdk.getConfig()).toEqual({
      baseUrl: 'https://custom.example.com',
      timeout: 5000,
    });
  });

  it('should throw error when apiKey is missing', () => {
    expect(() => {
      new AppOracleSDK({
        apiKey: '',
      });
    }).toThrow(AppOracleError);
  });
});
