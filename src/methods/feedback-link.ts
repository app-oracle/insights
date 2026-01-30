import { FeedbackLinkOptions, DeepLinkResponse, FeedbackMetadata } from '../types';
import { AppOracleError } from '../errors';
import { hashWallet } from '../utils/wallet';
import { stringifyMetadata } from '../utils/metadata';

const FEEDBACK_DEEPLINK_ENDPOINT = '/generateFeedbackDeepLink';

interface ClientContext {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

/**
 * Generate a feedback deep link
 * 
 * Creates a Redis entry with the provided metadata and returns a deep link URL
 * that can be used to access the feedback data in your mini-app.
 */
export async function getFeedbackLink(
  context: ClientContext,
  options: FeedbackLinkOptions
): Promise<DeepLinkResponse> {
  const { appVersion, wallet, metadata, requestAppReview } = options;

  // Validate inputs
  if (!appVersion || appVersion.trim() === '') {
    throw new AppOracleError('App version is required', 'VALIDATION_ERROR');
  }

  // Determine effective requestAppReview value
  // Default to true if wallet provided, false otherwise
  const hasWallet = wallet && wallet.trim() !== '';
  const effectiveRequestAppReview = requestAppReview !== undefined 
    ? requestAppReview 
    : hasWallet;

  // Validate that requestAppReview=true requires a wallet for user verification
  if (effectiveRequestAppReview && !hasWallet) {
    throw new AppOracleError(
      'Wallet address is required when requesting a review. Reviews are only available for wallet-verified users to ensure authenticity.',
      'VALIDATION_ERROR'
    );
  }

  if (metadata && typeof metadata !== 'object') {
    throw new AppOracleError('Metadata must be a valid object', 'VALIDATION_ERROR');
  }

  // Validate metadata field count (reserve 1 field for wallet hash if provided)
  const metadataEntries = metadata ? Object.entries(metadata) : [];
  const maxFields = wallet ? 3 : 4;
  if (metadataEntries.length > maxFields) {
    throw new AppOracleError(
      `Metadata cannot contain more than ${maxFields} fields`,
      'VALIDATION_ERROR'
    );
  }

  // Convert metadata values to strings
  const stringifiedMetadata = stringifyMetadata(metadata);

  // Hash wallet if provided to enable user verification
  // The wallet is hashed using SHA-256 to protect user privacy
  if (wallet && wallet.trim() !== '') {
    const walletHash = await hashWallet(wallet);
    stringifiedMetadata['_walletHash'] = walletHash;
  }

  // Add review request flag if true
  if (effectiveRequestAppReview) {
    stringifiedMetadata['_requestedAppReview'] = 'true';
  }

  // Construct the API endpoint
  const endpoint = `${context.baseUrl}${FEEDBACK_DEEPLINK_ENDPOINT}`;

  // Prepare request payload
  const payload = {
    appVersion,
    metadata: stringifiedMetadata,
  };

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), context.timeout);

    // Make API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.apiKey}`,
        'X-App-Oracle-SDK': 'typescript/0.1.0',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
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
          `Request timed out after ${context.timeout}ms`,
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
