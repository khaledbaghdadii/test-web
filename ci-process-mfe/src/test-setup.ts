// setup-jest.ts
import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";
setupZoneTestEnv();

jest.setTimeout(120000);
