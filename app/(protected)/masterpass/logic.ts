import { logDebug, logError } from "@/lib/logger";
import { markSudoActive } from "@/lib/sudo-mode";

// Enhanced crypto configuration for maximum security with optimal performance
export class MasterPassCrypto {
  private static instance: MasterPassCrypto;
  private masterKey: CryptoKey | null = null;
  private isUnlocked = false;
  private static readonly DEFAULT_TIMEOUT = 10 * 60 * 1000; // 10 minutes default

  static getInstance(): MasterPassCrypto {
    if (!MasterPassCrypto.instance) {
      MasterPassCrypto.instance = new MasterPassCrypto();
    }
    return MasterPassCrypto.instance;
  }

  // Enhanced configuration constants
  private static readonly PBKDF2_ITERATIONS = 600000; // OWASP 2023 recommendation
  private static readonly SALT_SIZE = 32; // 256-bit salt
  private static readonly IV_SIZE = 16; // 128-bit IV for AES-GCM
  private static readonly KEY_SIZE = 256; // 256-bit key for AES-256

  // Derive key from master password using PBKDF2
  private async deriveKey(
    password: string,
    salt: Uint8Array,
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"],
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: MasterPassCrypto.PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: MasterPassCrypto.KEY_SIZE },
      true, // Make extractable for passkey functionality
      ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
    );
  }

  // Getter for the master key, needed for passkey logic
  getMasterKey(): CryptoKey | null {
    return this.masterKey;
  }

  // Export the raw master key
  async exportKey(): Promise<ArrayBuffer | null> {
    if (!this.masterKey) return null;
    return crypto.subtle.exportKey("raw", this.masterKey);
  }

  // Import a raw key and set it as the master key
  async importKey(keyBytes: ArrayBuffer): Promise<void> {
    this.masterKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM", length: 256 },
      true, // Make it extractable so it can be re-wrapped
      ["encrypt", "decrypt", "wrapKey", "unwrapKey"],
    );
  }

  // Unlock a key has been imported (e.g., from passkey)
  async unlockWithImportedKey(): Promise<boolean> {
    if (!this.masterKey) {
      logError("Cannot unlock with imported key: key is not present");
      return false;
    }
    this.isUnlocked = true;
    sessionStorage.setItem("vault_unlocked", Date.now().toString());
    markSudoActive();
    return true;
  }

  // Unlock vault with master password
  async unlock(
    masterPassword: string,
    userId: string,
    isFirstTime: boolean = false,
  ): Promise<boolean> {
    try {
      // 1. Try to unlock via Keychain (New Architecture)
      const keychainSuccess = await this.unlockWithKeychain(masterPassword, userId);
      if (keychainSuccess) {
        this.isUnlocked = true;
        sessionStorage.setItem("vault_unlocked", Date.now().toString());
        markSudoActive();
        return true;
      }

      // 2. If first time setup, create new keychain entry
      if (isFirstTime) {
        // Generate a random MEK for new users
        this.masterKey = await this.generateRandomMEK();

        // Create keychain entry immediately
        await this.createKeychainEntry(this.masterKey, masterPassword, userId);

        this.isUnlocked = true;
        sessionStorage.setItem("vault_unlocked", Date.now().toString());
        markSudoActive();
        return true;
      }

      return false;
    } catch (error) {
      logError("Failed to unlock vault", error as Error);
      return false;
    }
  }

  // Change master password (re-wrap MEK)
  async changeMasterPassword(newPassword: string, userId: string): Promise<void> {
    if (!this.masterKey) {
      throw new Error("Vault is locked");
    }

    // Re-wrap MEK with new password
    await this.createKeychainEntry(this.masterKey, newPassword, userId);
  }

  // Generate a random Master Encryption Key (MEK)
  private async generateRandomMEK(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );
  }

  // Unlock using the Keychain architecture
  private async unlockWithKeychain(password: string, userId: string): Promise<boolean> {
    try {
      const { AppwriteService } = await import("../../../lib/appwrite");
      const keychainEntries = await AppwriteService.listKeychainEntries(userId);

      // Find password type entry
      const passwordEntry = keychainEntries.find(k => k.type === 'password');

      if (!passwordEntry) {
        return false; // No keychain entry found
      }

      // Derive AuthKey using the stored salt
      const salt = new Uint8Array(
        atob(passwordEntry.salt).split("").map(c => c.charCodeAt(0))
      );

      const authKey = await this.deriveKey(password, salt);

      // Unwrap the MEK
      const wrappedKeyBytes = new Uint8Array(
        atob(passwordEntry.wrappedKey).split("").map(c => c.charCodeAt(0))
      );

      // Extract IV (first 16 bytes)
      const iv = wrappedKeyBytes.slice(0, MasterPassCrypto.IV_SIZE);
      const ciphertext = wrappedKeyBytes.slice(MasterPassCrypto.IV_SIZE);

      try {
        const mekBytes = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: iv },
          authKey,
          ciphertext
        );

        // Import the MEK
        this.masterKey = await crypto.subtle.importKey(
          "raw",
          mekBytes,
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
        );

        return true;
      } catch (e) {
        logDebug("Failed to unwrap key with provided password", { error: e });
        return false;
      }
    } catch (error) {
      logError("Error in unlockWithKeychain", error as Error);
      return false;
    }
  }

  // Create a new keychain entry (wraps the MEK with the password)
  private async createKeychainEntry(mek: CryptoKey, password: string, userId: string): Promise<void> {
    try {
      const { AppwriteService } = await import("../../../lib/appwrite");

      // Generate new random salt for the AuthKey
      const salt = crypto.getRandomValues(new Uint8Array(MasterPassCrypto.SALT_SIZE));
      const authKey = await this.deriveKey(password, salt);

      // Export MEK to raw bytes
      const mekBytes = await crypto.subtle.exportKey("raw", mek);

      // Encrypt (Wrap) the MEK with AuthKey
      const iv = crypto.getRandomValues(new Uint8Array(MasterPassCrypto.IV_SIZE));
      const encryptedMek = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        authKey,
        mekBytes
      );

      // Combine IV + Encrypted MEK
      const combined = new Uint8Array(iv.length + encryptedMek.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedMek), iv.length);

      const wrappedKeyBase64 = btoa(String.fromCharCode(...combined));
      const saltBase64 = btoa(String.fromCharCode(...salt));

      // Check if entry exists to update or create
      const existing = await AppwriteService.listKeychainEntries(userId);
      const passwordEntry = existing.find(k => k.type === 'password');

      if (passwordEntry) {
        await AppwriteService.deleteKeychainEntry(passwordEntry.$id);
      }

      await AppwriteService.createKeychainEntry({
        userId,
        type: 'password',
        credentialId: null,
        wrappedKey: wrappedKeyBase64,
        salt: saltBase64,
        params: JSON.stringify({
          iterations: MasterPassCrypto.PBKDF2_ITERATIONS,
          algo: "SHA-256"
        }),
        isBackup: false
      });

    } catch (error) {
      logError("Failed to create keychain entry", error as Error);
      throw error;
    }
  }

  // Lock vault (clear master key from memory)
  lock(): void {
    this.masterKey = null;
    this.isUnlocked = false;
    sessionStorage.removeItem("vault_unlocked");
  }

  // Reset master password (clear vault and force new setup)
  resetMasterPassword(): void {
    this.lockApplication();

    // Clear any setup flags
    if (typeof window !== "undefined") {
      const userId = sessionStorage.getItem("current_user_id");
      if (userId) {
        localStorage.removeItem(`masterpass_setup_${userId}`);
      }
    }
  }

  // Get timeout setting from localStorage or use default
  private getTimeoutSetting(): number {
    const saved = localStorage.getItem("vault_timeout_minutes");
    return saved
      ? parseInt(saved) * 60 * 1000
      : MasterPassCrypto.DEFAULT_TIMEOUT;
  }

  // Set timeout setting
  static setTimeoutMinutes(minutes: number): void {
    localStorage.setItem("vault_timeout_minutes", minutes.toString());
  }

  // Get timeout in minutes for UI
  static getTimeoutMinutes(): number {
    const saved = localStorage.getItem("vault_timeout_minutes");
    return saved ? parseInt(saved) : 10; // default 10 minutes
  }

  // Check if vault is unlocked with dynamic timeout
  isVaultUnlocked(): boolean {
    if (!this.isUnlocked || !this.masterKey) return false;

    const unlockTime = sessionStorage.getItem("vault_unlocked");
    if (unlockTime) {
      const elapsed = Date.now() - parseInt(unlockTime);
      const timeout = this.getTimeoutSetting();
      if (elapsed > timeout) {
        this.lockApplication();
        return false;
      }
    }
    return true;
  }

  // Encrypt data before sending to database
  async encryptData(data: unknown): Promise<string> {
    logDebug("encryptData called", {
      isVaultUnlocked: this.isVaultUnlocked(),
      hasMasterKey: !!this.masterKey,
      isUnlockedFlag: this.isUnlocked
    });

    if (!this.isVaultUnlocked()) {
      throw new Error("Vault is locked - cannot encrypt data");
    }

    // Validate input data
    if (data === null || data === undefined) {
      throw new Error("Cannot encrypt null or undefined data");
    }

    // Convert to string if not already
    const dataToEncrypt = typeof data === "string" ? data : String(data);

    if (dataToEncrypt.trim().length === 0) {
      throw new Error("Cannot encrypt empty string");
    }

    try {
      const encoder = new TextEncoder();
      const plaintext = encoder.encode(JSON.stringify(dataToEncrypt));

      // Generate larger IV for enhanced security
      const iv = crypto.getRandomValues(
        new Uint8Array(MasterPassCrypto.IV_SIZE),
      );

      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        this.masterKey!,
        plaintext,
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Return base64 encoded string
      const result = btoa(String.fromCharCode(...combined));
      logDebug("Encryption successful", { resultLength: result.length });
      return result;
    } catch (error) {
      logError("Encryption failed", error as Error);
      throw new Error("Failed to encrypt data: " + error);
    }
  }

  // Decrypt data received from database
  async decryptData(encryptedData: string): Promise<unknown> {
    if (!this.isVaultUnlocked()) {
      throw new Error("Vault is locked");
    }

    // Validate input
    if (!encryptedData || typeof encryptedData !== "string") {
      throw new Error("Invalid encrypted data provided");
    }

    if (encryptedData.trim().length === 0) {
      throw new Error("Cannot decrypt empty string");
    }

    try {
      // Decode base64
      const combined = new Uint8Array(
        atob(encryptedData)
          .split("")
          .map((char) => char.charCodeAt(0)),
      );

      // Extract IV (now 16 bytes) and encrypted data
      const iv = combined.slice(0, MasterPassCrypto.IV_SIZE);
      const encrypted = combined.slice(MasterPassCrypto.IV_SIZE);

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        this.masterKey!,
        encrypted,
      );

      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decrypted);
      return JSON.parse(plaintext);
    } catch (error) {
      logError("Decryption failed", error as Error);
      throw new Error("Failed to decrypt data");
    }
  }

  // Application lock functionality
  lockApplication(): void {
    // Clear all decrypted data from memory
    this.masterKey = null;
    this.isUnlocked = false;

    // Clear session storage
    sessionStorage.removeItem("vault_unlocked");

    // Clear any cached decrypted data
    this.clearDecryptedCache();

    // Force garbage collection if available
    if (typeof window !== "undefined" && "gc" in window) {
      (window as Window & { gc?: () => void }).gc?.();
    }
  }

  // Clear any cached decrypted data from components
  private clearDecryptedCache(): void {
    // Dispatch custom event to notify components to clear their decrypted data
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vault-locked"));
    }
  }

  // Update activity timestamp
  updateActivity(): void {
    if (this.isUnlocked) {
      // Throttle updates to once per second to avoid rapid event bursts
      const last = sessionStorage.getItem("vault_unlocked");
      const now = Date.now();
      if (!last || now - parseInt(last) >= 1000) {
        sessionStorage.setItem("vault_unlocked", now.toString());
      }
    }
  }

  // Explicit lock trigger for UI actions
  lockNow(): void {
    this.lockApplication();
  }
}

export const masterPassCrypto = MasterPassCrypto.getInstance();

// Export utility functions for settings page
export const setVaultTimeout = (minutes: number) => {
  MasterPassCrypto.setTimeoutMinutes(minutes);
};

export const getVaultTimeout = () => {
  return MasterPassCrypto.getTimeoutMinutes();
};

// Utility functions for field-specific encryption with validation
export const encryptField = async (value: string): Promise<string> => {
  // Validate input before encryption
  if (value === null || value === undefined) {
    throw new Error("Cannot encrypt null or undefined value");
  }

  if (typeof value !== "string") {
    throw new Error("Can only encrypt string values");
  }

  if (value.trim().length === 0) {
    throw new Error("Cannot encrypt empty string");
  }

  return masterPassCrypto.encryptData(value);
};

export const decryptField = async (encryptedValue: string): Promise<string> => {
  // Validate input before decryption
  if (!encryptedValue || typeof encryptedValue !== "string") {
    throw new Error("Invalid encrypted value provided");
  }

  if (encryptedValue.trim().length === 0) {
    throw new Error("Cannot decrypt empty string");
  }

  return masterPassCrypto.decryptData(encryptedValue) as Promise<string>;
};

// Add utility function for reset
export const resetMasterPasswordVault = () => {
  masterPassCrypto.resetMasterPassword();
};
