// Spike HACK-006: WebCrypto (same API as browsers) -> JSON for verify.py.
// Usage: node spikes/crypto/sign.mjs out.json
import { writeFileSync } from 'node:fs';
const { subtle } = globalThis.crypto;
const hex = (u8) => Buffer.from(u8).toString('hex');
const b64 = (buf) => Buffer.from(buf).toString('base64');

// Payer key: NOT extractable (private part never leaves); public JWK is always exportable.
const payer = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
const message = crypto.getRandomValues(new Uint8Array(61)); // stands in for the 61-byte IOU
const sig = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, payer.privateKey, message));
if (sig.length !== 64) throw new Error(`expected raw r||s of 64 bytes, got ${sig.length}`);
let extractable = true;
try { await subtle.exportKey('jwk', payer.privateKey); } catch { extractable = false; }
if (extractable) throw new Error('private key must not be extractable');

// Server key (test-only; extractable so verify.py can decrypt).
const server = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const eph = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
const shared = await subtle.deriveBits({ name: 'ECDH', public: server.publicKey }, eph.privateKey, 256);
const hkdfKey = await subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
const aesKey = await subtle.deriveKey(
  { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode('sinsenal-v1') },
  hkdfKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const signed = new Uint8Array([...message, ...sig]); // 125 bytes
const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, signed);
const epk = await subtle.exportKey('raw', eph.publicKey); // 65 bytes, 0x04||X||Y

writeFileSync(process.argv[2] ?? 'out.json', JSON.stringify({
  message_hex: hex(message), sig_rs_hex: hex(sig),
  payer_pubkey_jwk: await subtle.exportKey('jwk', payer.publicKey),
  server_private_jwk: await subtle.exportKey('jwk', server.privateKey),
  epk_b64: b64(epk), iv_b64: b64(iv), ciphertext_b64: b64(ct), plaintext_hex: hex(signed),
}, null, 2));
console.log(`signed ${message.length} B -> sig ${sig.length} B; envelope ct ${ct.byteLength} B`);
