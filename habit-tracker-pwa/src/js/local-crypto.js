/**
 * 备份加解密 — 全程在浏览器内完成，不请求网络、不使用 crypto.subtle。
 * 算法：PBKDF2-SHA256（100k 次）+ AES-256-GCM
 */

import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes } from '@noble/hashes/utils.js';

export const LOCAL_CIPHER_ID = 'AES-GCM-256-PBKDF2-SHA256';
const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export function isLocalCryptoAvailable() {
  return typeof TextEncoder !== 'undefined' && typeof btoa === 'function';
}

function bytesToBase64(bytes) {
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(password, salt) {
  const enc = new TextEncoder();
  return pbkdf2Async(sha256, enc.encode(password), salt, {
    c: PBKDF2_ITERATIONS,
    dkLen: 32,
  });
}

/** 在本地将明文加密为 Base64 密文包（salt + iv + ciphertext） */
export async function encryptLocal(plaintext, password) {
  if (!isLocalCryptoAvailable()) {
    throw new Error('当前环境无法运行本地加密，请换用较新的浏览器。');
  }

  const enc = new TextEncoder();
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveAesKey(password, salt);
  const iv = randomBytes(IV_BYTES);
  const cipherBytes = gcm(key, iv).encrypt(enc.encode(plaintext));

  const packed = new Uint8Array(SALT_BYTES + IV_BYTES + cipherBytes.length);
  packed.set(salt, 0);
  packed.set(iv, SALT_BYTES);
  packed.set(cipherBytes, SALT_BYTES + IV_BYTES);
  return bytesToBase64(packed);
}

/** 在本地解密 Base64 密文包，返回 UTF-8 字符串 */
export async function decryptLocal(ciphertextBase64, password) {
  if (!isLocalCryptoAvailable()) {
    throw new Error('当前环境无法运行本地解密，请换用较新的浏览器。');
  }

  try {
    const packed = base64ToBytes(ciphertextBase64);
    if (packed.length < SALT_BYTES + IV_BYTES + 1) {
      throw new Error('invalid length');
    }

    const salt = packed.slice(0, SALT_BYTES);
    const iv = packed.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
    const ciphertext = packed.slice(SALT_BYTES + IV_BYTES);

    const key = await deriveAesKey(password, salt);
    const plainBytes = gcm(key, iv).decrypt(ciphertext);
    return new TextDecoder().decode(plainBytes);
  } catch {
    throw new Error('密码错误，或备份数据已被篡改/损坏。');
  }
}

/**
 * 构造带元数据的本地加密备份外壳（仍仅为 JSON 文件，不含网络传输）
 */
export async function wrapLocalEncryptedBackup(plaintextJson, password) {
  const data = await encryptLocal(plaintextJson, password);
  return {
    encrypted: true,
    localOnly: true,
    cipher: LOCAL_CIPHER_ID,
    version: 1,
    data,
  };
}
