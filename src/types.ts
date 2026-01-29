/**
 * Configuration options for the App Oracle SDK
 */
export interface SDKConfig {
  /**
   * API key for authentication with App Oracle service
   */
  apiKey: string;

  /**
   * Application ID to identify your app
   */
  appId: string;

  /**
   * Base URL for the App Oracle API
   * @default 'https://api.apporacle.com'
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 10000
   */
  timeout?: number;
}

/**
 * Metadata to be stored with the feedback deep link
 * Key-value pairs that will be converted to strings
 * Supports: string, number, boolean, Date, and null
 */
export type FeedbackMetadata = Record<string, string | number | boolean | Date | null>;

/**
 * Response from generating a feedback deep link
 */
export interface DeepLinkResponse {
  /**
   * The deep link URL to share with users
   */
  url: string;

  /**
   * The unique key used to look up feedback data
   */
  key: string;

  /**
   * Optional expiration timestamp for the deep link
   */
  expiresAt?: string;
}

/**
 * Error response from the API
 */
export interface APIErrorResponse {
  error: string;
  code?: string;
  message?: string;
}
