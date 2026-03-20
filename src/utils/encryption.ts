import crypto from "crypto";

const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const UTF8_FORMAT = "utf8";
const BASE64_FORMAT = "base64";
const AES_256_GCM = "aes-256-gcm";

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("Missing ENCRYPTION_KEY");
  }
  return Buffer.from(key, "hex");
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    AES_256_GCM,
    getKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(text, UTF8_FORMAT),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString(BASE64_FORMAT);
}

export function decrypt(encryptedText: string): string {
  const data = Buffer.from(encryptedText, BASE64_FORMAT);
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const text = data.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(
    AES_256_GCM, 
    getKey(), 
    iv
  );
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(text),
    decipher.final()
  ]);

  return decrypted.toString(UTF8_FORMAT);
}