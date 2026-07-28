import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";
import "@testing-library/jest-dom";

setupZoneTestEnv();

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

class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, "ResizeObserver", {
  value: ResizeObserverMock,
  writable: true,
});
global.ResizeObserver = ResizeObserverMock;
