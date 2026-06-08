import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";

setupZoneTestEnv({
  errorOnUnknownElements: true,
});
jest.setTimeout(120_000);
