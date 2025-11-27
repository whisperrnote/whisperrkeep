# Architecture Analysis: Scalable Encryption & Passkey Integration

## 1. Problem Analysis
The current architecture derives the encryption key directly from the master password (`PBKDF2(password, salt)`). This creates a tight coupling between the authentication credential (password) and the data encryption key.

**Current Flow:**
`Password -> Derived Key -> Encrypt/Decrypt Data`

**Consequences:**
1.  **Scalability Bottleneck**: Changing the master password changes the Derived Key. This necessitates decrypting **every single record** (credentials, TOTP secrets, folders, etc.) with the old key and re-encrypting with the new key. For a user with 1,000 items, this is thousands of crypto operations and database writes.
2.  **Passkey Limitation**: Since the key is derived from the *password*, a Passkey (which uses public/private key crypto) cannot mathematically derive the same symmetric key. This makes "independent" passkey access (without a password fallback or server-side key storage) impossible in the current model.

## 2. Proposed Architecture: Key Wrapping (Envelope Encryption)
To solve both issues, we must decouple the **Data Encryption Key (DEK)** from the **Authentication Key (AuthKey)**.

**New Flow:**
1.  **Master Encryption Key (MEK)**: A random 256-bit AES key generated *once*. This key encrypts all user data. It **never changes** (unless explicitly rotated).
2.  **Key Wrapping**: The MEK is encrypted (wrapped) by keys derived from authentication methods.
3.  **Keychain**: A new storage structure that holds these wrapped keys.

`Auth Method (Password/Passkey) -> Derived AuthKey -> Decrypt Wrapped MEK -> MEK -> Encrypt/Decrypt Data`

### 2.1. Zero-Re-encryption Migration
We can migrate existing users **without** re-encrypting their data.
1.  **Current State**: Data is encrypted with `Old_Derived_Key`.
2.  **Migration Step**:
    - User logs in with Password.
    - We derive `Old_Derived_Key`.
    - Instead of generating a *new* random MEK (which would force re-encryption), we **designate the `Old_Derived_Key` as the permanent MEK**.
    - We generate a new `AuthKey` from the password (using a different salt or algorithm parameters to ensure cryptographic separation).
    - We encrypt the MEK with this new `AuthKey`.
    - We store this `Wrapped_MEK` in the `keychain`.
3.  **Result**: The underlying key protecting the data hasn't changed, so the data doesn't need to be touched. But now we have a wrapped key architecture.

### 2.2. Changing Master Password (O(1) Operation)
1.  User provides `Old_Password` and `New_Password`.
2.  Unlock vault: Derive `AuthKey_Old` -> Decrypt `Wrapped_MEK` -> Get `MEK`.
3.  Derive `AuthKey_New` from `New_Password`.
4.  Encrypt `MEK` with `AuthKey_New` -> `New_Wrapped_MEK`.
5.  Update the `keychain` entry.
6.  **Done**. No user data is touched.

### 2.3. Independent Passkeys
1.  **WebAuthn PRF (Pseudo-Random Function)**: We utilize the PRF extension of WebAuthn (supported in Chrome, Edge, Safari).
2.  **Flow**:
    - Authenticator generates a deterministic secret (`PRF_Output`) based on a salt we provide.
    - We use `PRF_Output` as the `AuthKey_Passkey`.
    - We encrypt the `MEK` with `AuthKey_Passkey`.
    - Store this as a separate entry in the `keychain`.
3.  **Login**:
    - User authenticates with Passkey.
    - Browser returns `PRF_Output`.
    - We fetch the passkey's `keychain` entry.
    - Decrypt to get `MEK`.
    - Vault is unlocked.

## 3. Database Schema Changes (`appwrite.config.json`)

We need a new collection `keychain` to store the wrapped keys.

### New Collection: `keychain`
| Field | Type | Required | Encrypted | Description |
|-------|------|----------|-----------|-------------|
| `userId` | String | Yes | No | Owner of the key |
| `type` | String | Yes | No | `password`, `passkey`, `recovery` |
| `credentialId` | String | No | No | WebAuthn Credential ID (for passkeys) |
| `wrappedKey` | String | Yes | No | The MEK encrypted by the AuthKey (Base64) |
| `salt` | String | Yes | No | Salt used for key derivation |
| `params` | String | No | No | JSON of algo params (iterations, algo name) |
| `isBackup` | Boolean | No | No | If this is a recovery key |

### Updates to `user` Collection
- We can deprecate `check`, `salt`, `masterpass` fields in the `user` collection over time, or keep them for legacy fallback until migration is complete.
- `passkeyBlob` in `user` collection becomes obsolete as it's replaced by the `keychain` entry.

## 4. Implementation Roadmap

### Phase 1: Foundation (The "Keychain")
1.  Create `keychain` collection in Appwrite.
2.  Update `MasterPassCrypto` to support "Key Wrapping".
    - Add `wrapKey(keyToWrap, wrappingKey)` and `unwrapKey(wrappedKey, unwrappingKey)`.
3.  Implement `migrateToKeychain()` function:
    - Runs on login.
    - Checks if `keychain` has an entry for this user.
    - If not, performs the "Zero-Re-encryption Migration" described above.

### Phase 2: Password Change Logic
1.  Update "Change Password" UI/Logic to use the new flow:
    - Decrypt MEK with old pass.
    - Encrypt MEK with new pass.
    - Update `keychain`.

### Phase 3: Passkey Integration
1.  Update Passkey registration to request PRF capability.
2.  When registering a passkey:
    - Get PRF output.
    - Encrypt the current in-memory MEK with the PRF output.
    - Create a `keychain` entry with `type: 'passkey'`.
3.  Update Login flow:
    - If logging in with Passkey, request PRF.
    - Fetch `keychain` entry.
    - Decrypt MEK.

## 5. Security Considerations
- **Separation**: Ensure the `AuthKey` (derived from password for wrapping) is cryptographically distinct from the `MEK` (legacy derived key). Using a different salt or a KDF context string ensures this.
- **PRF Support**: Not all authenticators support PRF yet.
    - *Fallback*: For devices without PRF, we can't support "independent" decryption. The passkey would only log them in, but they'd still need to type the master password to decrypt (or we use a less secure "server-side wrapped key" approach, which we should avoid if possible).
    - *Recommendation*: Enforce PRF for "Passwordless Vault Access". If PRF is missing, warn the user "This passkey can verify your identity but cannot unlock your vault without your password."

## 6. Proposed `appwrite.config.json` Changes

```json
{
    "tables": [
        // ... existing tables ...
        {
            "$id": "keychain",
            "$permissions": [
                "create(\"users\")"
            ],
            "databaseId": "passwordManagerDb",
            "name": "Keychain",
            "enabled": true,
            "rowSecurity": true,
            "columns": [
                {
                    "key": "userId",
                    "type": "string",
                    "required": true,
                    "size": 255,
                    "array": false
                },
                {
                    "key": "type",
                    "type": "string",
                    "required": true,
                    "size": 50,
                    "array": false
                },
                {
                    "key": "credentialId",
                    "type": "string",
                    "required": false,
                    "size": 1024,
                    "array": false
                },
                {
                    "key": "wrappedKey",
                    "type": "string",
                    "required": true,
                    "size": 5000,
                    "array": false
                },
                {
                    "key": "salt",
                    "type": "string",
                    "required": true,
                    "size": 255,
                    "array": false
                },
                {
                    "key": "params",
                    "type": "string",
                    "required": false,
                    "size": 5000,
                    "array": false
                },
                {
                    "key": "isBackup",
                    "type": "boolean",
                    "required": false,
                    "default": false,
                    "array": false
                }
            ],
            "indexes": [
                {
                    "key": "idx_keychain_user",
                    "type": "key",
                    "attributes": ["userId"]
                },
                {
                    "key": "idx_keychain_credential",
                    "type": "key",
                    "attributes": ["credentialId"]
                }
            ]
        }
    ]
}
```
