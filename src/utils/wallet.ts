/**
 * Hash wallet address using SHA-256
 * 
 * Use this to hash wallet addresses with the same algorithm used internally
 * for client-side verification of deep link ownership.
 */
export async function getWalletHash(wallet: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(wallet.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
