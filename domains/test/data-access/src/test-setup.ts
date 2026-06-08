import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";

setupZoneTestEnv({
  errorOnUnknownElements: true,
});
jest.setTimeout(120_000);
Object.defineProperty(window, "matchMedia", {
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addListener: jest.fn(),
    onchange: null,
    removeListener: jest.fn(),
    removeEventListener: jest.fn(),
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
  writable: true,
});
