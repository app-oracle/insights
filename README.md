# App Oracle SDK

TypeScript SDK for generating feedback deep links via the App Oracle platform. Store metadata in Redis and create shareable deep links that route users to your mini-app with contextual feedback data.

## Installation

```bash
npm install app-oracle-sdk
# or
yarn add app-oracle-sdk
# or
bun add app-oracle-sdk
```

## Quick Start

```typescript
import { AppOracleSDK } from 'app-oracle-sdk';

// Initialize the SDK
const sdk = new AppOracleSDK({
  apiKey: 'your-api-key',
});

// Generate a feedback deep link with wallet verification
const result = await sdk.getFeedbackLink({
  appVersion: '1.2.3',
  wallet: '0x1234567890abcdef',
  metadata: {
    userId: '12345',
    platform: 'ios',
    deviceModel: 'iPhone 14',
  }
});

console.log(result.url);  // apporacle://feedback?key=abc123
console.log(result.key);  // abc123
```

## API Reference

### `AppOracleSDK`

The main SDK client for interacting with the App Oracle API.

#### Constructor

```typescript
new AppOracleSDK(config: SDKConfig)
```

**Parameters:**

- `config.apiKey` (string, required) - Your App Oracle API key
- `config.baseUrl` (string, optional) - Custom API base URL (default: `https://us-central1-app-oracle-b7156.cloudfunctions.net`)
- `config.timeout` (number, optional) - Request timeout in milliseconds (default: `10000`)

**Example:**

```typescript
const sdk = new AppOracleSDK({
  apiKey: process.env.APP_ORACLE_API_KEY!,
  timeout: 5000,
});
```

#### `getFeedbackLink(options)`

Generate a feedback deep link with wallet verification and optional app review request.

**Parameters:**

- `options.appVersion` (string, required) - The version of your app (e.g., "1.0.0")
- `options.wallet` (string, optional) - User's wallet address (hashed with SHA-256 for privacy)
- `options.metadata` (Record<string, string | number | boolean | Date | null>, optional) - Key-value pairs to store (max 3 fields with wallet, 4 without)
- `options.requestAppReview` (boolean, optional) - Request app review (defaults to `true` when wallet provided, `false` otherwise)

**Returns:** `Promise<DeepLinkResponse>`

```typescript
interface DeepLinkResponse {
  url: string;        // The deep link URL to share
  key: string;        // Unique key for Redis lookup
  expiresAt?: string; // Optional expiration timestamp
}
```

**Example:**

```typescript
// With wallet verification and app review (review defaults to true)
const deepLink = await sdk.getFeedbackLink({
  appVersion: '2.1.0',
  wallet: '0x1234567890abcdef',
  metadata: {
    userId: 'user_12345',
    sessionId: 'sess_abc789',
    feature: 'checkout',
  }
});

// Without wallet (no review request)
const deepLink = await sdk.getFeedbackLink({
  appVersion: '2.1.0',
  metadata: {
    userId: 'user_12345',
    sessionId: 'sess_abc789',
    feature: 'checkout',
    timestamp: new Date(),
  }
});

// With wallet but opt out of review
const deepLink = await sdk.getFeedbackLink({
  appVersion: '2.1.0',
  wallet: '0x1234567890abcdef',
  metadata: { userId: 'user_12345' },
  requestAppReview: false
});

// Share deepLink.url with your users
// Use deepLink.key for tracking or analytics
```

#### `hashWallet(wallet)`

Hash a wallet address using SHA-256. Use this to verify wallet hashes match the same algorithm used internally.

**Parameters:**

- `wallet` (string, required) - Wallet address to hash

**Returns:** `Promise<string>` - SHA-256 hash as hex string

**Example:**

```typescript
const hash = await sdk.hashWallet('0x1234567890abcdef');
// Compare with _walletHash from deep link metadata
```

### Error Handling

The SDK throws `AppOracleError` for all error conditions:

```typescript
import { AppOracleSDK, AppOracleError } from 'app-oracle-sdk';

try {
  const result = await sdk.getFeedbackLink({
    appVersion: '1.0.0',
    wallet: '0x123',
    metadata: { userId: '123' }
  });
} catch (error) {
  if (error instanceof AppOracleError) {
    console.error('Error code:', error.code);
    console.error('Status code:', error.statusCode);
    
    if (error.isAuthError()) {
      // Handle authentication errors
    } else if (error.isValidationError()) {
      // Handle validation errors
    } else if (error.isNetworkError()) {
      // Handle network errors
    }
  }
}
```

### Error Types

- `VALIDATION_ERROR` - Invalid input parameters
- `AUTH_ERROR` - Authentication failed (invalid API key)
- `NETWORK_ERROR` - Network request failed
- `TIMEOUT_ERROR` - Request exceeded timeout
- `API_ERROR` - API returned an error response
- `INVALID_RESPONSE` - API returned malformed data

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import type { 
  SDKConfig, 
  FeedbackMetadata, 
  FeedbackLinkOptions,
  DeepLinkResponse 
} from 'app-oracle-sdk';

const config: SDKConfig = {
  apiKey: 'key',
};

const options: FeedbackLinkOptions = {
  appVersion: '1.0.0',
  wallet: '0x123',
  metadata: {
    userId: '123',
    platform: 'android',
  }
};
```

## Development

```bash
# Install dependencies
bun install

# Start development mode
bun run dev

# Build for production
bun run build

# Run tests
bun run test

# Lint code
bun run lint

# Format code
bun run format
```

## Module Formats

This library exports both ESM and CommonJS formats:

- `dist/index.js` - ESM
- `dist/index.cjs` - CommonJS
- `dist/index.d.ts` - TypeScript declarations

## Requirements

- Node.js >= 20
- TypeScript >= 5.0 (for development)

## License

MIT © Waylan Sands
