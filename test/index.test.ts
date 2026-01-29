import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppOracleSDK, AppOracleError } from '../src';

describe('AppOracleSDK', () => {
  describe('constructor', () => {
    it('should create an instance with valid config', () => {
      const sdk = new AppOracleSDK({
        apiKey: 'test-api-key',
        appId: 'test-app-id',
      });

      expect(sdk).toBeInstanceOf(AppOracleSDK);
      expect(sdk.getConfig()).toEqual({
        appId: 'test-app-id',
        baseUrl: 'https://api.apporacle.com',
        timeout: 10000,
      });
    });

    it('should accept custom baseUrl and timeout', () => {
      const sdk = new AppOracleSDK({
        apiKey: 'test-api-key',
        appId: 'test-app-id',
        baseUrl: 'https://custom.example.com',
        timeout: 5000,
      });

      expect(sdk.getConfig()).toEqual({
        appId: 'test-app-id',
        baseUrl: 'https://custom.example.com',
        timeout: 5000,
      });
    });

    it('should throw error when apiKey is missing', () => {
      expect(() => {
        new AppOracleSDK({
          apiKey: '',
          appId: 'test-app-id',
        });
      }).toThrow(AppOracleError);
    });

    it('should throw error when appId is missing', () => {
      expect(() => {
        new AppOracleSDK({
          apiKey: 'test-api-key',
          appId: '',
        });
      }).toThrow(AppOracleError);
    });
  });

  describe('generateFeedbackDeepLink', () => {
    let sdk: AppOracleSDK;

    beforeEach(() => {
      sdk = new AppOracleSDK({
        apiKey: 'test-api-key',
        appId: 'test-app-id',
      });
      
      // Reset fetch mock
      global.fetch = vi.fn();
    });

    it('should validate appVersion is required', async () => {
      await expect(
        sdk.generateFeedbackDeepLink('', { userId: '123' })
      ).rejects.toThrow(AppOracleError);
    });

    it('should validate metadata is an object', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        sdk.generateFeedbackDeepLink('1.0.0', null)
      ).rejects.toThrow(AppOracleError);
    });

    it('should validate metadata cannot exceed 4 fields', async () => {
      await expect(
        sdk.generateFeedbackDeepLink('1.0.0', {
          field1: 'value1',
          field2: 'value2',
          field3: 'value3',
          field4: 'value4',
          field5: 'value5',
        })
      ).rejects.toThrow(AppOracleError);
    });

    it('should accept metadata with exactly 4 fields', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sdk.generateFeedbackDeepLink('1.0.0', {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
        field4: 'value4',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should convert numbers to strings', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await sdk.generateFeedbackDeepLink('1.0.0', { userId: 12345 });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.apporacle.com/v1/feedback/deeplink',
        expect.objectContaining({
          body: JSON.stringify({
            appId: 'test-app-id',
            appVersion: '1.0.0',
            metadata: {
              userId: '12345',
            },
          }),
        })
      );
    });

    it('should convert booleans to strings', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await sdk.generateFeedbackDeepLink('1.0.0', { isSubscriber: true });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.apporacle.com/v1/feedback/deeplink',
        expect.objectContaining({
          body: JSON.stringify({
            appId: 'test-app-id',
            appVersion: '1.0.0',
            metadata: {
              isSubscriber: 'true',
            },
          }),
        })
      );
    });

    it('should convert Date to ISO string', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const testDate = new Date('2026-01-29T10:30:00.000Z');
      await sdk.generateFeedbackDeepLink('1.0.0', { timestamp: testDate });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.apporacle.com/v1/feedback/deeplink',
        expect.objectContaining({
          body: JSON.stringify({
            appId: 'test-app-id',
            appVersion: '1.0.0',
            metadata: {
              timestamp: '2026-01-29T10:30:00.000Z',
            },
          }),
        })
      );
    });

    it('should convert null to string', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await sdk.generateFeedbackDeepLink('1.0.0', { optionalField: null });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.apporacle.com/v1/feedback/deeplink',
        expect.objectContaining({
          body: JSON.stringify({
            appId: 'test-app-id',
            appVersion: '1.0.0',
            metadata: {
              optionalField: 'null',
            },
          }),
        })
      );
    });

    it('should handle mixed metadata types', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const testDate = new Date('2026-01-29T10:30:00.000Z');
      await sdk.generateFeedbackDeepLink('1.0.0', {
        userId: 12345,
        isSubscriber: true,
        timestamp: testDate,
        platform: 'ios',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.apporacle.com/v1/feedback/deeplink',
        expect.objectContaining({
          body: JSON.stringify({
            appId: 'test-app-id',
            appVersion: '1.0.0',
            metadata: {
              userId: '12345',
              isSubscriber: 'true',
              timestamp: '2026-01-29T10:30:00.000Z',
              platform: 'ios',
            },
          }),
        })
      );
    });

    it('should reject invalid metadata value types', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        sdk.generateFeedbackDeepLink('1.0.0', { invalid: { nested: 'object' } })
      ).rejects.toThrow(AppOracleError);
    });

    it('should successfully generate deep link', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
        expiresAt: '2026-01-30T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sdk.generateFeedbackDeepLink('1.0.0', {
        userId: '12345',
        platform: 'ios',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.apporacle.com/v1/feedback/deeplink',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          }),
          body: JSON.stringify({
            appId: 'test-app-id',
            appVersion: '1.0.0',
            metadata: {
              userId: '12345',
              platform: 'ios',
            },
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Invalid API key',
          code: 'AUTH_ERROR',
        }),
      });

      await expect(
        sdk.generateFeedbackDeepLink('1.0.0', { userId: '123' })
      ).rejects.toThrow(AppOracleError);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        sdk.generateFeedbackDeepLink('1.0.0', { userId: '123' })
      ).rejects.toThrow(AppOracleError);
    });

    it('should handle invalid response format', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      await expect(
        sdk.generateFeedbackDeepLink('1.0.0', { userId: '123' })
      ).rejects.toThrow(AppOracleError);
    });
  });
});

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
