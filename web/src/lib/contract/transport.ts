/** One byte pipe between phones. Implementations: QR (animated), sound (ggwave), NFC (NDEF). */
export interface Transport {
  send(bytes: Uint8Array): Promise<void>;
  receive(): AsyncIterable<Uint8Array>;
}
