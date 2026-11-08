import { afterEach, describe, expect, it, vi } from "vitest";
import { startVoice } from "./realtime";

vi.mock("../../lib/api", () => ({
  api: vi.fn(async () => ({ client_secret: "ek_test", expires_at: 0, model: "m", herramientas: [] })),
}));

afterEach(() => vi.unstubAllGlobals());

describe("startVoice", () => {
  it("releases the microphone when the call setup fails after getUserMedia", async () => {
    const track = { stop: vi.fn() };
    const mic = { getTracks: () => [track] };
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: vi.fn(async () => mic) } });
    class FakePc {
      localDescription = { sdp: "v=0" };
      connectionState = "new";
      onconnectionstatechange: (() => void) | null = null;
      ontrack: unknown = null;
      addTrack() {}
      createDataChannel() {
        return { close: vi.fn(), send: vi.fn(), onmessage: null };
      }
      async createOffer() {
        return { type: "offer", sdp: "v=0" };
      }
      async setLocalDescription() {}
      async setRemoteDescription() {
        throw new Error("invalid sdp");
      }
      close = vi.fn();
    }
    vi.stubGlobal("RTCPeerConnection", FakePc);
    vi.stubGlobal("Audio", class { autoplay = false; srcObject: unknown = null; });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("network"); }));
    const onEnd = vi.fn();
    await expect(startVoice(() => {}, onEnd)).rejects.toThrow();
    expect(track.stop).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });
});
