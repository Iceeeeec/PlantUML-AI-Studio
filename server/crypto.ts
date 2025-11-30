/**
 * 后端加解密工具
 * 使用 AES-GCM 加密，与前端 Web Crypto API 兼容
 */

import * as crypto from 'crypto';

const SECRET_KEY = 'PlantUML-AI-2024-SecretKey-32bit'; // 32字节密钥
const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;

/**
 * 加密数据
 * 输出格式: Base64(IV + Ciphertext + AuthTag)
 * 与 Web Crypto API 的 AES-GCM 输出格式兼容
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12); // 12字节 IV
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  const authTag = cipher.getAuthTag();
  
  // Web Crypto API 格式: IV (12) + Ciphertext + AuthTag (16)
  const combined = Buffer.concat([iv, encrypted, authTag]);
  
  return combined.toString('base64');
}

/**
 * 解密数据
 * 输入格式: Base64(IV + Ciphertext + AuthTag)
 * 与 Web Crypto API 的 AES-GCM 输入格式兼容
 */
export function decrypt(ciphertext: string): string {
  const combined = Buffer.from(ciphertext, 'base64');
  
  // Web Crypto API 格式: IV (12) + Ciphertext + AuthTag (16)
  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(12, combined.length - AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}
