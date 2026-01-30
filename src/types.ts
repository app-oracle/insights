/**
 * Configuration options for the App Oracle SDK
 */
export interface SDKConfig {
  /**
   * API key for authentication with App Oracle service
   */
  apiKey: string;

  /**
   * Base URL for the App Oracle API
   * @default 'https://us-central1-app-oracle-b7156.cloudfunctions.net'
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
 * Options for generating a feedback deep link
 */
export interface FeedbackLinkOptions {
  /**
   * The version of your app to record version metrics (e.g., "1.0.0")
   */
  appVersion: string;

  /**
   * User's wallet address. The wallet is hashed using SHA-256 to protect user privacy
   * while enabling verification that reviews come from your users.
   */
  wallet?: string;

  /**
   * Key-value pairs of metadata to store with the feedback (max 3 fields when wallet provided, 4 otherwise)
   */
  metadata?: FeedbackMetadata;

  /**
   * Request an app review. Defaults to `true` when wallet is provided, `false` otherwise.
   * Set explicitly to `false` to opt out.
   */
  requestAppReview?: boolean;
}

/**
 * Options for generating a review deep link
 */
export interface ReviewLinkOptions {
  /**
   * The version of your app to record version metrics (e.g., "1.0.0")
   */
  appVersion: string;

  /**
   * User's wallet address (required). The wallet is hashed using SHA-256 to protect user privacy
   * while enabling verification that reviews come from your users.
   */
  wallet: string;

  /**
   * Key-value pairs of metadata to store with the review (max 3 fields)
   */
  metadata?: FeedbackMetadata;
}

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
