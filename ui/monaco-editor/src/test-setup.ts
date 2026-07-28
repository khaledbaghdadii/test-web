import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";

// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};

setupZoneTestEnv();

// Monaco editor calls CSS.escape() which is a browser-only API not available in Node.js/jsdom.
// This polyfill prevents the process from crashing when monaco-editor modules are loaded.
if (typeof (globalThis as unknown as { CSS?: unknown }).CSS === "undefined") {
  Object.defineProperty(globalThis, "CSS", {
    value: { escape: (value: string) => value },
    configurable: true,
  });
}

const documentWithLegacyCommands = document as unknown as Record<
  string,
  unknown
>;

if (typeof documentWithLegacyCommands["queryCommandSupported"] !== "function") {
  Object.defineProperty(document, "queryCommandSupported", {
    value: () => false,
    configurable: true,
  });
}
