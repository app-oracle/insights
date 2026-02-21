# App Oracle Insights SDK

TypeScript SDK for generating feedback deep links via the App Oracle platform. Store metadata in Redis and create shareable deep links that route users to your mini-app with contextual feedback data.

## Installation

```bash
npm install @apporacle/insights
# or
yarn add @apporacle/insights
# or
bun add @apporacle/insights
```

## ⚠️ Important: Server-Side Only

**This SDK is designed for server-side use only.** Your API key provides full access to your App Oracle account and must be kept secret.

- ✅ **DO** use this SDK in your backend server, API routes, or serverless functions
- ✅ **DO** store your API key in environment variables
- ❌ **DO NOT** use this SDK in client-side code (browser, mobile app)
- ❌ **DO NOT** expose your API key in frontend code, git repositories, or public files

## Security

### Protecting Your API Key

**Never hardcode your API key.** Always use environment variables:

```bash
# .env file (never commit this!)
APP_ORACLE_API_KEY=your-api-key-here
```

```typescript
// ✅ Good - uses environment variable
const sdk = new Insights({
  apiKey: process.env.APP_ORACLE_API_KEY!,
});

// ❌ Bad - hardcoded API key
const sdk = new Insights({
  apiKey: 'ak_1234567890', // NEVER DO THIS
});
```

### Reporting Security Issues

If you discover a security vulnerability, please email security@apporacle.com instead of using the issue tracker.

## Quick Start

```typescript
import { Insights } from '@apporacle/insights';

// Initialize the SDK with your API key from environment variables
const sdk = new Insights({
  apiKey: process.env.APP_ORACLE_API_KEY!,
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

### `Insights`

The main SDK client for interacting with the App Oracle API.

#### Constructor

```typescript
new Insights(config: SDKConfig)
```

**Parameters:**

- `config.apiKey` (string, required) - Your App Oracle API key
- `config.baseUrl` (string, optional) - Custom API base URL (default: `https://us-central1-app-oracle-b7156.cloudfunctions.net`)
- `config.timeout` (number, optional) - Request timeout in milliseconds (default: `10000`)

**Example:**

```typescript
const sdk = new Insights({
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

#### `getWalletHash(wallet)`

Hash a wallet address using SHA-256. Use this to verify wallet hashes match the same algorithm used internally.

This function can be used via the SDK instance or imported directly without initializing the SDK.

**Parameters:**

- `wallet` (string, required) - Wallet address to hash

**Returns:** `Promise<string>` - SHA-256 hash as hex string

**Example:**

```typescript
// Via SDK instance
const hash = await sdk.getWalletHash('0x1234567890abcdef');

// Or import directly without SDK
import { getWalletHash } from '@apporacle/insights';
const hash = await getWalletHash('0x1234567890abcdef');

// Compare with _walletHash from deep link metadata
```

### Error Handling

The SDK throws `AppOracleError` for all error conditions:

```typescript
import { Insights, AppOracleError } from '@apporacle/insights';

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
} from '@apporacle/insights';

const config: SDKConfig = {
  apiKey: process.env.APP_ORACLE_API_KEY!,
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
