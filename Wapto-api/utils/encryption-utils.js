import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const KEY = process.env.ENCRYPTION_KEY;
if (!KEY || KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY environment variable is not defined or is not exactly 32 characters/bytes long (required for aes-256-cbc).');
} 


export const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};


export const decrypt = (text) => {
  if (!text) return null;
  try {
    const textParts = text.split(':');
    if (textParts.length < 2) return null;
    const ivHex = textParts.shift();
    if (ivHex.length !== 32) return null;
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return null;
  }
};

export const isEncrypted = (text) => {
  if (typeof text !== 'string' || !text) return false;
  const textParts = text.split(':');
  return textParts.length >= 2 && textParts[0].length === 32;
};

export const decryptApiKey = (text) => {
  if (!text) return null;
  if (isEncrypted(text)) {
    const decrypted = decrypt(text);
    if (decrypted) return decrypted;
  }
  return text;
};

export const maskApiKey = (key) => {
  if (!key || typeof key !== 'string') return null;
  const trimmed = key.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 8) return '••••••••';
  return '••••••••' + trimmed.slice(-4);
};

export default {
  encrypt,
  decrypt,
  isEncrypted,
  decryptApiKey,
  maskApiKey
};

