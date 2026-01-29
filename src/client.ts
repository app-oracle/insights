import { SDKConfig, FeedbackMetadata, DeepLinkResponse, APIErrorResponse } from './types';
import { AppOracleError } from './errors';

/**
 * App Oracle SDK Client
 * 
 * @example
 * ```typescript
 * const sdk = new AppOracleSDK({
 *   apiKey: 'your-api-key',
 *   appId: 'your-app-id'
 * });
 * 
 * const result = await sdk.generateFeedbackDeepLink('1.0.0', {
 *   userId: '12345',
 *   platform: 'ios'
 * });
 * 
 * console.log(result.url); // Deep link to share
 * ```
 */
export class AppOracleSDK {
  private readonly apiKey: string;
  private readonly appId: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: SDKConfig) {
    // Validate required fields
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new AppOracleError('API key is required', 'VALIDATION_ERROR');
    }

    if (!config.appId || config.appId.trim() === '') {
      throw new AppOracleError('App ID is required', 'VALIDATION_ERROR');
    }

    this.apiKey = config.apiKey;
    this.appId = config.appId;
    this.baseUrl = config.baseUrl || 'https://api.apporacle.com';
    this.timeout = config.timeout || 10000;
  }

  /**
   * Generate a feedback deep link
   * 
   * Creates a Redis entry with the provided metadata and returns a deep link URL
   * that can be used to access the feedback data in your mini-app.
   * 
   * @param appVersion - The version of your app (e.g., "1.0.0")
   * @param metadata - Key-value pairs of metadata to store with the feedback
   * @returns Promise resolving to the deep link response with URL and key
   * 
   * @throws {AppOracleError} If validation fails, authentication fails, or network error occurs
   * 
   * @example
   * ```typescript
   * const result = await sdk.generateFeedbackDeepLink('1.2.3', {
   *   userId: '12345',
   *   platform: 'ios',
   *   deviceModel: 'iPhone 14'
   * });
   * 
   * // Share result.url with users
   * // Use result.key for tracking
   * ```
   */
  async generateFeedbackDeepLink(
    appVersion: string,
    metadata: FeedbackMetadata
  ): Promise<DeepLinkResponse> {
    // Validate inputs
    if (!appVersion || appVersion.trim() === '') {
      throw new AppOracleError('App version is required', 'VALIDATION_ERROR');
    }

    if (!metadata || typeof metadata !== 'object') {
      throw new AppOracleError('Metadata must be a valid object', 'VALIDATION_ERROR');
    }

    // Validate metadata field count
    const metadataEntries = Object.entries(metadata);
    if (metadataEntries.length > 4) {
      throw new AppOracleError(
        'Metadata cannot contain more than 4 fields',
        'VALIDATION_ERROR'
      );
    }

    // Convert metadata values to strings
    const stringifiedMetadata: Record<string, string> = {};
    for (const [key, value] of metadataEntries) {
      if (value === null) {
        stringifiedMetadata[key] = 'null';
      } else if (value instanceof Date) {
        stringifiedMetadata[key] = value.toISOString();
      } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        stringifiedMetadata[key] = String(value);
      } else {
        throw new AppOracleError(
          `Metadata value for key "${key}" must be a string, number, boolean, Date, or null`,
          'VALIDATION_ERROR'
        );
      }
    }

    // Construct the API endpoint
    const endpoint = `${this.baseUrl}/v1/feedback/deeplink`;

    // Prepare request payload
    const payload = {
      appId: this.appId,
      appVersion,
      metadata: stringifiedMetadata,
    };

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // Make API request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-App-Oracle-SDK': 'typescript/0.1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        const errorData: APIErrorResponse = await response.json().catch(() => ({
          error: 'Unknown error',
        }));

        throw new AppOracleError(
          errorData.message || errorData.error || `Request failed with status ${response.status}`,
          errorData.code || 'API_ERROR',
          response.status
        );
      }

      // Parse successful response
      const data: DeepLinkResponse = await response.json();

      // Validate response structure
      if (!data.url || !data.key) {
        throw new AppOracleError(
          'Invalid response from server: missing url or key',
          'INVALID_RESPONSE'
        );
      }

      return data;
    } catch (error) {
      // Handle network errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new AppOracleError(
            `Request timed out after ${this.timeout}ms`,
            'TIMEOUT_ERROR'
          );
        }

        if (error instanceof AppOracleError) {
          throw error;
        }

        throw new AppOracleError(
          `Network error: ${error.message}`,
          'NETWORK_ERROR'
        );
      }

      throw new AppOracleError('Unknown error occurred', 'UNKNOWN_ERROR');
    }
  }

  /**
   * Get the current configuration (without exposing sensitive data)
   */
  getConfig(): Omit<SDKConfig, 'apiKey'> {
    return {
      appId: this.appId,
      baseUrl: this.baseUrl,
      timeout: this.timeout,
    };
  }
}
