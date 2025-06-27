# Firebase Configuration Fix for Coolify Deployment

## Problem
Firebase private key with `\n` characters causes parsing errors in containerized environments like Coolify.

## Solution Options

### Option 1: Base64 Encoding (Recommended)

1. **Generate base64 encoded key:**
   ```bash
   node scripts/encode-firebase-key.js
   ```

2. **In Coolify, add this environment variable:**
   ```
   FIREBASE_PRIVATE_KEY_BASE64=<the_base64_encoded_string_from_step_1>
   ```

3. **Remove or comment out the regular FIREBASE_PRIVATE_KEY in Coolify**

### Option 2: Proper Escaping (Alternative)

If you prefer to keep using the regular format, in Coolify set:

```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDMIRSSLHBOEuEJ\nbVGNSpc9cKdrR3+ollDK4qs1j2xu8L8IM/atHxSrYAwBDxUuJZ3xl/5JYD/a3J3P\noJEj68QO6z5bgtbsIetO797iq1p1RfRKW3b/Hzcok+IgaJNwfdmNJ6ycS+rQS0Xd\nxIo2iKsbFgJRFoJx7UCNVLLLfIXwScsVrRwFFtUtT73R2AbvRYDgl2tEfC5Nd9PB\nhZihDoNKqz8TV9XH/mqAgMG23mhmd5cIdIZhCirxNuSUj7z2zd2u0tbEbdhUT5W7\nQYr4CiVvYpJWy87E3827n0nPtlpO5ItvaFDS4E+k/sUkH/Qsyd4bM/KwzGpbD+r+\nWr8hyMrFAgMBAAECggEAEgEu88+onjJLGA5E3a4BFgG8OpmlWGTdvm9sw34hhc2F\nQ/91WALAS3dex68hYp8dxcPuwWEUcMT5xGj4tE7kzZ4RM3ggZdZ+D0nYAm0zvtlL\nOU3E+q6xqkoU7V/b9VWcXTdtIaIOlY22HV/rAvFeCjcQQD+4hLz07yJT3N/gXnez\ndRU8YHrWaaYCRbUerPxTJFFYjNnvqkpAoEV6MwPMgxU4x1h4LyLZ+nFzFXWIViJb\n+5XsVKz2w+d/m9viPdPZdJIBw7+fBv5o24sX9G4DB4kni4FXx7elmHfwnA2Kc4R4\nheHOvrfqCYO2Z/IkdyqIqqqKEz87PbcR2YYvkyv9hwKBgQDo+ke1R7dB2DT4YIQa\nG2VI7EG9OV9HPTB7UW2BK0TF8NxA4pXedoETasBTeXbJS0Cnh1bVPzF8FKVxWVVB\nG9rahC3+EH55n0/rjc5a8QbzNxGRMlDSt/NB+G8GRNox4F4RMGU4F6/p6w5ipTsD\nU5GomYZI+Mwnwe4fojc5ONb5wwKBgQDgTQLMaaloCu14JxBIOyFs3vHXT1wIYSDA\n0iP75FP603+XwIYccrmtCFutSUS7h/PE+CQYVpnjDzh6MNJFv+LQISsQpeEH7AF3\nB0E1wvHywT4+07TJ05kS1QjYWLLQ5XBavhnEDbuOsd4kYFs8H1kIb5P88XMYrtzy\nmAj9qvZY1wKBgBaPNaZeHWao0uhCIEiO4o3fIrZ5+bniOPGX/uyFDhHEsu8tgama\n/ACvU5RBrLjtKoOOXWAk0Fvde++v4Mt/MP/70KBLZJPOU2TRxGuV70BZ0r+miaD9\n4vY+YjHPNPmjajhr4UE/Oe+CrU/sA/zceLxEsXYbcVlgM/ioMoS99kMVAoGBAKNh\nVQ2CVYRUmV7wzVpfv9wmlPApfTcZUJtDNjTPvyAwGHt4H/fu1TKlqOmTOf6Da9vo\nh5o20obi2lee4jsuJ09FKbJJsZ1smjCSVzyK0GPrwKRQ3xo4CAMArB2yliW1Sl6+\no9P70MeC5fWHPk2P4/FSHPCdCyJKlOQcPEhR1HknAoGBAIMfutb0F2qzB8E4QxZb\n9zeUOa1nclNu8NP4aEEZnVEaXh1KL+OBlxtRSdMzgkYaMOe2eqljRtlChsfyuOWi\ntaGc7/PfgX6UuK0TcV2DFfX1vIOb9lFsRrgAYp4j0yELIb3koK/CDqfd/r9g7Hd2\nfRiqwS1hmYVIKGJL4lzscGCb\n-----END PRIVATE KEY-----"
```

**Important:** Make sure there are no extra spaces or characters.

## What Changed in the Code

The Firebase configuration now:
1. First tries to use `FIREBASE_PRIVATE_KEY_BASE64` (base64 encoded)
2. Falls back to `FIREBASE_PRIVATE_KEY` with improved parsing
3. Handles malformed keys in containerized environments
4. Provides better error messages

## Testing

After deploying with the new configuration, you should see:
- ✅ `Using base64 encoded Firebase private key` (if using Option 1)
- ✅ `Firebase Admin SDK initialized successfully`

Instead of:
- ❌ `Failed to parse private key: Error: Invalid PEM formatted message`

## Recommendation

Use **Option 1 (Base64 encoding)** as it's the most reliable for containerized deployments and avoids all newline character issues.
