import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";

setupZoneTestEnv();

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

jest.setTimeout(120000);
