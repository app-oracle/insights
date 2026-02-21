import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Insights, AppOracleError } from '../src';

const TEST_BASE_URL = 'https://us-central1-app-oracle-b7156.cloudfunctions.net';
const TEST_ENDPOINT = `${TEST_BASE_URL}/feedbackDeepLink`;

describe('Insights - getFeedbackLink', () => {
  let sdk: Insights;

  beforeEach(() => {
    sdk = new Insights({
      apiKey: 'test-api-key',
    });
    
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  describe('Validation', () => {
    it('should validate appVersion is required', async () => {
      await expect(
        sdk.getFeedbackLink({ appVersion: '' })
      ).rejects.toThrow(AppOracleError);
    });

    it('should validate requestAppReview requires wallet', async () => {
      await expect(
        sdk.getFeedbackLink({ appVersion: '1.0.0', requestAppReview: true })
      ).rejects.toThrow('Wallet address is required when requesting a review');
    });

    it('should validate metadata is an object', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        sdk.getFeedbackLink({ appVersion: '1.0.0', wallet: '0x123', metadata: 'not-an-object' })
      ).rejects.toThrow(AppOracleError);
    });

    it('should validate metadata cannot exceed 4 fields', async () => {
      await expect(
        sdk.getFeedbackLink({
          appVersion: '1.0.0',
          wallet: '0x123',
          metadata: {
            field1: 'value1',
            field2: 'value2',
            field3: 'value3',
            field4: 'value4',
            field5: 'value5',
          }
        })
      ).rejects.toThrow(AppOracleError);
    });

    it('should reject invalid metadata value types', async () => {
      await expect(
        sdk.getFeedbackLink({
          appVersion: '1.0.0',
          wallet: '0xABC123',
          // @ts-expect-error Testing invalid input
          metadata: { invalid: { nested: 'object' } }
        })
      ).rejects.toThrow(AppOracleError);
    });
  });

  describe('Basic Functionality', () => {
    it('should work with just appVersion', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sdk.getFeedbackLink({ appVersion: '1.0.0' });
      expect(result).toEqual(mockResponse);
      
      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.walletHash).toBeUndefined();
      expect(callBody.requestReview).toBeUndefined();
    });

    it('should accept metadata with exactly 3 fields when wallet provided', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sdk.getFeedbackLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: {
          field1: 'value1',
          field2: 'value2',
          field3: 'value3',
        }
      });

      expect(result).toEqual(mockResponse);
      
      // Wallet provided should default requestAppReview to true
      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.requestReview).toBe(true);
    });
  });

  describe('Review Request Behavior', () => {
    it('should include requestAppReview flag when true', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await sdk.getFeedbackLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: { userId: '123' },
        requestAppReview: true
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.walletHash).toBeDefined();
      expect(callBody.requestReview).toBe(true);
    });

    it('should not include requestAppReview when explicitly false', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await sdk.getFeedbackLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: { userId: '123' },
        requestAppReview: false
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.walletHash).toBeDefined();
      expect(callBody.requestReview).toBeUndefined();
    });
  });

  describe('Type Conversions', () => {
    it('should convert numbers to strings', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await sdk.getFeedbackLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: { userId: 12345 }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        TEST_ENDPOINT,
        expect.objectContaining({
          body: expect.stringContaining('"userId":"12345"'),
        })
      );
      
      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.walletHash).toBeDefined();
      expect(callBody.metadata.userId).toBe('12345');
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

      await sdk.getFeedbackLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: { isSubscriber: true }
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.walletHash).toBeDefined();
      expect(callBody.metadata.isSubscriber).toBe('true');
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
      await sdk.getFeedbackLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: { timestamp: testDate }
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.walletHash).toBeDefined();
      expect(callBody.metadata.timestamp).toBe('2026-01-29T10:30:00.000Z');
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

      await sdk.getFeedbackLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: { optionalField: null }
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.walletHash).toBeDefined();
      expect(callBody.metadata.optionalField).toBe('null');
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
      await sdk.getFeedbackLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: {
          userId: 12345,
          isSubscriber: true,
          timestamp: testDate,
        }
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.walletHash).toBeDefined();
      expect(callBody.metadata.userId).toBe('12345');
      expect(callBody.metadata.isSubscriber).toBe('true');
      expect(callBody.metadata.timestamp).toBe('2026-01-29T10:30:00.000Z');
    });
  });

  describe('Wallet Hashing', () => {
    it('should hash wallet and include in metadata', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await sdk.getFeedbackLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: { userId: '12345' }
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      
      // Verify wallet hash is present
      expect(callBody.walletHash).toBeDefined();
      expect(callBody.walletHash).toHaveLength(64); // SHA-256 hex is 64 chars
      
      // Verify wallet is normalized (lowercased)
      await sdk.getFeedbackLink({
        appVersion: '1.0.0',
        wallet: '0xabc123',
        metadata: { userId: '12345' }
      });
      const secondCallBody = JSON.parse((global.fetch as any).mock.calls[1][1].body);
      
      // Same wallet (different case) should produce same hash
      expect(callBody.walletHash).toBe(secondCallBody.walletHash);
    });
  });

  describe('API Integration', () => {
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

      const result = await sdk.getFeedbackLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: {
          userId: '12345',
          platform: 'ios',
        }
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        TEST_ENDPOINT,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
      
      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.walletHash).toBeDefined();
      expect(callBody.metadata.userId).toBe('12345');
      expect(callBody.metadata.platform).toBe('ios');
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
        sdk.getFeedbackLink({
          appVersion: '1.0.0',
          wallet: '0xABC123',
          metadata: { userId: '123' }
        })
      ).rejects.toThrow(AppOracleError);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        sdk.getFeedbackLink({
          appVersion: '1.0.0',
          wallet: '0xABC123',
          metadata: { userId: '123' }
        })
      ).rejects.toThrow(AppOracleError);
    });

    it('should handle invalid response format', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      await expect(
        sdk.getFeedbackLink({
          appVersion: '1.0.0',
          wallet: '0xABC123',
          metadata: { userId: '123' }
        })
      ).rejects.toThrow(AppOracleError);
    });
  });
});
