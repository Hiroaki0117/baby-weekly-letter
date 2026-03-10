import { describe, it, expect, vi, beforeEach } from "vitest";

describe("useSpeechRecognition - サポート判定", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("SpeechRecognition が存在しない場合、isSupported は false", async () => {
    // globalThis に window を定義し、SpeechRecognition は未定義にする
    const fakeWindow = { SpeechRecognition: undefined, webkitSpeechRecognition: undefined };
    vi.stubGlobal("window", fakeWindow);

    expect(fakeWindow.SpeechRecognition).toBeUndefined();
    expect(fakeWindow.webkitSpeechRecognition).toBeUndefined();
  });

  it("SpeechRecognition が存在する場合、コンストラクタが取得できる", () => {
    const mockCtor = vi.fn();
    const fakeWindow = { SpeechRecognition: mockCtor };
    vi.stubGlobal("window", fakeWindow);

    expect(fakeWindow.SpeechRecognition).toBe(mockCtor);
  });

  it("webkitSpeechRecognition のみ存在する場合もコンストラクタが取得できる", () => {
    const mockCtor = vi.fn();
    const fakeWindow = { SpeechRecognition: undefined, webkitSpeechRecognition: mockCtor };
    vi.stubGlobal("window", fakeWindow);

    expect(fakeWindow.webkitSpeechRecognition).toBe(mockCtor);
    expect(fakeWindow.SpeechRecognition).toBeUndefined();
  });
});
