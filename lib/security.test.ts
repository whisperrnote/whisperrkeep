/**
 * Tests for security utility functions
 * Note: These tests run in Node.js environment without Web Crypto API
 * Some functions will throw errors as expected
 */

import {
  constantTimeCompare,
  clearSensitiveData,
} from "./security";

describe("constantTimeCompare", () => {
  it("should return true for identical strings", () => {
    expect(constantTimeCompare("hello", "hello")).toBe(true);
    expect(constantTimeCompare("password123", "password123")).toBe(true);
  });

  it("should return false for different strings", () => {
    expect(constantTimeCompare("hello", "world")).toBe(false);
    expect(constantTimeCompare("password", "password123")).toBe(false);
  });

  it("should return false for strings of different lengths", () => {
    expect(constantTimeCompare("short", "longer string")).toBe(false);
  });

  it("should handle empty strings", () => {
    expect(constantTimeCompare("", "")).toBe(true);
    expect(constantTimeCompare("", "non-empty")).toBe(false);
  });

  it("should be case-sensitive", () => {
    expect(constantTimeCompare("Hello", "hello")).toBe(false);
  });

  it("should handle special characters", () => {
    expect(constantTimeCompare("p@ssw0rd!", "p@ssw0rd!")).toBe(true);
    expect(constantTimeCompare("p@ssw0rd!", "p@ssw0rd?")).toBe(false);
  });
});

describe("clearSensitiveData", () => {
  it("should clear Uint8Array data", () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    clearSensitiveData(data);
    
    // All values should be zero
    for (let i = 0; i < data.length; i++) {
      expect(data[i]).toBe(0);
    }
  });

  it("should handle empty Uint8Array", () => {
    const data = new Uint8Array([]);
    clearSensitiveData(data);
    expect(data.length).toBe(0);
  });

  it("should handle string input (with warning)", () => {
    // Strings are immutable in JS, so this just logs a warning
    expect(() => clearSensitiveData("sensitive string")).not.toThrow();
  });
});

// Note: Tests for functions that depend on Web Crypto API
// (generateSecureRandom, generateRandomSalt, hashData, etc.)
// cannot run in Node.js environment without polyfills

describe("Security functions requiring Web Crypto API", () => {
  it("should document that these functions require browser environment", () => {
    // These functions would need to be tested in a browser environment
    // or with appropriate polyfills:
    // - generateSecureRandom()
    // - generateRandomSalt()
    // - createSessionToken()
    // - hashData()
    
    // This test serves as documentation
    expect(true).toBe(true);
  });
});
