import { FeedbackLinkOptions, DeepLinkResponse } from '../types';
import { stringifyMetadata } from '../utils/metadata';
import { getWalletHash } from '../utils/wallet';
import { AppOracleError } from '../errors';

const FEEDBACK_DEEPLINK_ENDPOINT = '/feedbackDeepLink';

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
  const { appVersion, wallet, metadata, requestAppReview, redirectUrl } = options;

  // Validate inputs
  if (!appVersion || appVersion.trim() === '') {
    throw new AppOracleError('App version is required', 'VALIDATION_ERROR');
  }

  // Determine effective requestAppReview value
  // Default to true if wallet provided, false otherwise
  const hasWallet = wallet && wallet.trim() !== '';
  const requiresReviewRequest = requestAppReview !== undefined 
    ? requestAppReview 
    : hasWallet;

  // Validate that requestAppReview=true requires a wallet for user verification
  if (requiresReviewRequest && !hasWallet) {
    throw new AppOracleError(
      'Wallet address is required when requesting a review. Reviews are only available for wallet-verified users to ensure authenticity.',
      'VALIDATION_ERROR'
    );
  }

  if (metadata && typeof metadata !== 'object') {
    throw new AppOracleError('Metadata must be a valid object', 'VALIDATION_ERROR');
  }

  // Validate metadata field count (max 4 fields)
  const metadataEntries = metadata ? Object.entries(metadata) : [];
  if (metadataEntries.length > 4) {
    throw new AppOracleError(
      'Metadata cannot contain more than 4 fields',
      'VALIDATION_ERROR'
    );
  }

  // Convert metadata values to strings
  const stringifiedMetadata = stringifyMetadata(metadata);

  // Hash wallet if provided to enable user verification
  // The wallet is hashed using SHA-256 to protect user privacy
  let walletHashValue: string | undefined;
  if (wallet && wallet.trim() !== '') {
    walletHashValue = await getWalletHash(wallet);
  }

  // Construct the API endpoint
  const endpoint = `${context.baseUrl}${FEEDBACK_DEEPLINK_ENDPOINT}`;

  // Prepare request payload
  const payload = {
    appVersion,
    metadata: stringifiedMetadata,
    ...(walletHashValue && { walletHash: walletHashValue }),
    ...(requiresReviewRequest && { requestReview: true }),
    ...(redirectUrl && { redirectUrl }),
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
    if (!data.url) {
      throw new AppOracleError(
        'Invalid response from server: missing url',
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
