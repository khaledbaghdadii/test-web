import { ClipboardService } from "./clipboard.service";

describe("ClipboardService", () => {
  let service: ClipboardService;
  let writeTextSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new ClipboardService();
    writeTextSpy = jest
      .fn()
      .mockResolvedValue(undefined) as unknown as jest.SpyInstance;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextSpy },
      writable: true,
      configurable: true,
    });
  });

  it("delegates to navigator.clipboard.writeText", async () => {
    await service.copyToClipboard("test-value");
    expect(writeTextSpy).toHaveBeenCalledWith("test-value");
  });

  it("returns the promise from writeText", () => {
    const result = service.copyToClipboard("test-value");
    expect(result).toBeInstanceOf(Promise);
  });

  it("propagates rejection from writeText", async () => {
    (writeTextSpy as jest.Mock).mockRejectedValue(new Error("denied"));
    await expect(service.copyToClipboard("test-value")).rejects.toThrow(
      "denied"
    );
  });
});
