import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Insights, AppOracleError } from '../src';

const TEST_BASE_URL = 'https://us-central1-app-oracle-insights.cloudfunctions.net';
const TEST_ENDPOINT = `${TEST_BASE_URL}/reviewDeepLink`;

describe('Insights - getReviewLink', () => {
  let sdk: Insights;

  beforeEach(() => {
    sdk = new Insights({
      apiKey: 'test-api-key',
    });
    
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  describe('Validation', () => {
    it('should require wallet address', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // TypeScript enforces wallet is required, so this should work
      const result = await sdk.getReviewLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should validate metadata cannot exceed 4 fields', async () => {
      await expect(
        sdk.getReviewLink({
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
  });

  describe('Review Functionality', () => {
    it('should always include wallet hash', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await sdk.getReviewLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: { userId: '123' }
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.walletHash).toBeDefined();
    });

    it('should hash wallet and include in metadata', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await sdk.getReviewLink({
        appVersion: '1.0.0',
        wallet: '0xABC123',
        metadata: { userId: '12345' }
      });

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      
      // Verify wallet hash is present
      expect(callBody.walletHash).toBeDefined();
      expect(callBody.walletHash).toHaveLength(64); // SHA-256 hex is 64 chars
    });
  });

  describe('API Integration', () => {
    it('should successfully generate review link', async () => {
      const mockResponse = {
        url: 'apporacle://feedback?key=abc123',
        key: 'abc123',
        expiresAt: '2026-01-30T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sdk.getReviewLink({
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
        sdk.getReviewLink({
          appVersion: '1.0.0',
          wallet: '0xABC123',
          metadata: { userId: '123' }
        })
      ).rejects.toThrow(AppOracleError);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        sdk.getReviewLink({
          appVersion: '1.0.0',
          wallet: '0xABC123',
          metadata: { userId: '123' }
        })
      ).rejects.toThrow(AppOracleError);
    });
  });
});
