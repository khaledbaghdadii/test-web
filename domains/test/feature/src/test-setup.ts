import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";

jest.setTimeout(120_000);
setupZoneTestEnv({
  errorOnUnknownElements: true,
});
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    removeEventListener: jest.fn(),
    addEventListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
    addListener: jest.fn(),
    onchange: null,
    media: query,
    matches: false,
  })),
});
