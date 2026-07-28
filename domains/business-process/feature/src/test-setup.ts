import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";
import "@testing-library/jest-dom";

setupZoneTestEnv();

// PrimeNG Tabs binds a ResizeObserver on init; jsdom does not implement it.
global.ResizeObserver = class {
  observe() {
    // no-op: jsdom stub
  }
  unobserve() {
    // no-op: jsdom stub
  }
  disconnect() {
    // no-op: jsdom stub
  }
};
