import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";

setupZoneTestEnv({
  errorOnUnknownElements: true,
});
jest.setTimeout(120_000);
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Element.prototype.animate = jest.fn().mockImplementation(() => ({
  cancel: jest.fn(),
  finish: jest.fn(),
  pause: jest.fn(),
  play: jest.fn(),
  reverse: jest.fn(),
  updatePlaybackRate: jest.fn(),
  persist: jest.fn(),
  commitStyles: jest.fn(),
  onfinish: null,
  oncancel: null,
  onremove: null,
  finished: Promise.resolve(),
  ready: Promise.resolve(),
  playState: "finished",
  playbackRate: 1,
  startTime: 0,
  currentTime: 0,
  timeline: null,
  pending: false,
  replaceState: "active",
  id: "",
  effect: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));
