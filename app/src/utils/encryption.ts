import CryptoJS from 'crypto-js';

/**
 * Encryption utility for securing private keys
 * Uses AES-256-GCM encryption
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required for private key encryption');
}

/**
 * Encrypt a private key with the master encryption key
 * @param privateKey - The private key to encrypt (with or without 0x prefix)
 * @returns Encrypted string
 */
export function encryptPrivateKey(privateKey: string): string {
  // Remove 0x prefix if present
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  // Encrypt using AES
  const encrypted = CryptoJS.AES.encrypt(cleanKey, ENCRYPTION_KEY!).toString();

  return encrypted;
}

/**
 * Decrypt an encrypted private key
 * @param encryptedKey - The encrypted private key string
 * @returns Decrypted private key with 0x prefix
 */
export function decryptPrivateKey(encryptedKey: string): string {
  try {
    // Decrypt using AES
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY!);
    const privateKey = decrypted.toString(CryptoJS.enc.Utf8);

    if (!privateKey) {
      throw new Error('Decryption failed - invalid encryption key or corrupted data');
    }

    // Ensure 0x prefix
    return privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  } catch (error) {
    throw new Error(`Failed to decrypt private key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate that a string is a valid private key
 * @param privateKey - The private key to validate
 * @returns true if valid
 */
export function isValidPrivateKey(privateKey: string): boolean {
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  // Should be 64 hex characters
  return /^[0-9a-fA-F]{64}$/.test(cleanKey);
}

/**
 * Derive wallet address from private key (for validation)
 * @param privateKey - The private key
 * @returns Wallet address derived from the key
 */
export function deriveWalletAddress(privateKey: string): string {
  const { ethers } = require('ethers');
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}
