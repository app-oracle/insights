import { ReviewLinkOptions, DeepLinkResponse } from '../types';
import { stringifyMetadata } from '../utils/metadata';
import { getWalletHash } from '../utils/wallet';
import { AppOracleError } from '../errors';

const REVIEW_DEEPLINK_ENDPOINT = '/reviewDeepLink';

interface ClientContext {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

/**
 * Generate a review deep link
 * 
 * Creates a Redis entry with the provided metadata and returns a deep link URL
 * specifically for app reviews. Requires a wallet address for user verification.
 */
export async function getReviewLink(
  context: ClientContext,
  options: ReviewLinkOptions
): Promise<DeepLinkResponse> {
  const { appVersion, wallet, metadata, redirectUrl } = options;

  // Validate inputs
  if (!appVersion || appVersion.trim() === '') {
    throw new AppOracleError('App version is required', 'VALIDATION_ERROR');
  }

  if (!wallet || wallet.trim() === '') {
    throw new AppOracleError('Wallet address is required for review links', 'VALIDATION_ERROR');
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

  // Hash wallet for user verification
  const walletHashValue = await getWalletHash(wallet);

  // Construct the API endpoint
  const endpoint = `${context.baseUrl}${REVIEW_DEEPLINK_ENDPOINT}`;

  // Prepare request payload
  const payload = {
    appVersion,
    metadata: stringifiedMetadata,
    walletHash: walletHashValue,
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
        'X-App-Oracle-SDK': 'typescript/0.2.0',
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
