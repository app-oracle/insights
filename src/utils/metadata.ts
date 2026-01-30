import { AppOracleError } from '../errors';
import { UserMetadata } from '../types';

/**
 * Convert metadata values to strings
 * 
 * Validates and converts metadata values to string format for API transmission.
 * Supports string, number, boolean, Date, and null types.
 */
export function stringifyMetadata(metadata?: UserMetadata): Record<string, string> {
  const stringifiedMetadata: Record<string, string> = {};
  
  if (!metadata) {
    return stringifiedMetadata;
  }

  const metadataEntries = Object.entries(metadata);
  
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

  return stringifiedMetadata;
}
