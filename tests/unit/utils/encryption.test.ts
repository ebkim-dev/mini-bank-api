import { decrypt, encrypt } from "../../../src/utils/encryption";

describe("encryption module", () => {
  it("should encrypt and decrypt correctly", () => {
    const text = "hello world";

    const encrypted = encrypt(text);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(text);
  });

  it("should throw if ciphertext is modified", () => {
    const encrypted = encrypt("hello");

    const tampered = encrypted.slice(0, -2) + "ab";

    expect(() => decrypt(tampered)).toThrow();
  });
  
  describe("encrypt function", () => {
    it("should return base64 string", () => {
      const encrypted = encrypt("test");

      const base64Regex = /^[A-Za-z0-9+/=]+$/;

      expect(base64Regex.test(encrypted)).toBe(true);
    });

    it("should produce different ciphertexts for same input", () => {
      const text = "hello";

      const e1 = encrypt(text);
      const e2 = encrypt(text);

      expect(e1).not.toBe(e2);
    });

    it("should throw if encryption key is missing", () => {
      delete process.env.ENCRYPTION_KEY;

      const text = "hello";
      expect(() => encrypt(text)).toThrow();
    })
  });
  
  describe("decrypt function", () => {
    it("should throw on invalid encrypted data", () => {
      expect(() => decrypt("not-base64")).toThrow();
    });
  });
});