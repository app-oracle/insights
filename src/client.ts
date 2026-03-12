import { SDKConfig, DeepLinkResponse, FeedbackLinkOptions, ReviewLinkOptions } from './types';
import { AppOracleError } from './errors';
import { getFeedbackLink } from './methods/feedback-link';
import { getReviewLink } from './methods/review-link';
import { getWalletHash } from './utils/wallet';

/**
 * Default base URL for the App Oracle API
 */
const DEFAULT_BASE_URL = 'https://us-central1-app-oracle-insights.cloudfunctions.net';

/**
 * App Oracle SDK Client
 * 
 * @example
 * ```typescript
 * const sdk = new Insights({
 *   apiKey: 'your-api-key'
 * });
 * 
 * const result = await sdk.getFeedbackLink({
 *   appVersion: '1.0.0',
 *   wallet: '0x123...',
 *   metadata: {
 *     userId: '12345',
 *     platform: 'ios'
 *   }
 * });
 * 
 * console.log(result.url); // Deep link to share
 * ```
 */
export class Insights {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: SDKConfig) {
    // Validate required fields
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new AppOracleError('API key is required', 'VALIDATION_ERROR');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.timeout = config.timeout || 10000;
  }

  private getContext() {
    return {
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      timeout: this.timeout,
    };
  }

  /**
   * Generate a feedback deep link
   * 
   * Creates a Redis entry with the provided metadata and returns a deep link URL
   * that can be used to access the feedback data in your mini-app.
   * 
   * @param options - Options for generating the feedback link
   * @returns Promise resolving to the deep link response with URL and key
   * 
   * @throws {AppOracleError} If validation fails, authentication fails, or network error occurs
   * 
   * @example
   * ```typescript
   * // With wallet (review request defaults to true)
   * const result = await sdk.getFeedbackLink({
   *   appVersion: '1.2.3',
   *   wallet: '0x1234...',
   *   metadata: {
   *     swaps: '69',
   *     highscore: '420',
   *     proUser: 'true',
   *   }
   * });
   * 
   * // Opt out of review request
   * const result = await sdk.getFeedbackLink({
   *   appVersion: '1.2.3',
   *   wallet: '0x1234...',
   *   metadata: {},
   *   requestAppReview: false
   * });
   * 
   * // Without wallet (no review request)
   * const result = await sdk.getFeedbackLink({ appVersion: '1.2.3' });
   * 
   * // Share result.url with users
   * ```
   */
  async getFeedbackLink(options: FeedbackLinkOptions): Promise<DeepLinkResponse> {
    return getFeedbackLink(this.getContext(), options);
  }

  /**
   * Hash wallet address using SHA-256
   * 
   * Use this to hash wallet addresses with the same algorithm used internally
   * for client-side verification of deep link ownership.
   * 
   * @param wallet - Wallet address to hash
   * @returns Promise resolving to the SHA-256 hash as a hex string
   * 
   * @example
   * ```typescript
   * const hash = await sdk.getWalletHash('0x1234...');
   * // Compare with _walletHash from deep link metadata
   * ```
   */
  async getWalletHash(wallet: string): Promise<string> {
    return getWalletHash(wallet);
  }

  /**
   * Generate a review deep link
   * 
   * Creates a Redis entry with the provided metadata and returns a deep link URL
   * specifically for app reviews. Requires a wallet address for user verification.
   * 
   * @param options - Options for generating the review link
   * @returns Promise resolving to the deep link response with URL and key
   * 
   * @throws {AppOracleError} If validation fails, authentication fails, or network error occurs
   * 
   * @example
   * ```typescript
   * const result = await sdk.getReviewLink({
   *   appVersion: '1.2.3',
   *   wallet: '0x1234...',
   *   metadata: {
   *     userId: '12345',
   *     platform: 'ios'
   *   }
   * });
   * 
   * // Share result.url with users for app review
   * ```
   */
  async getReviewLink(options: ReviewLinkOptions): Promise<DeepLinkResponse> {
    return getReviewLink(this.getContext(), options);
  }

  /**
   * Get the current configuration (without exposing sensitive data)
   */
  getConfig(): Omit<SDKConfig, 'apiKey'> {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
    };
  }
}
