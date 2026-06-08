import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";

// @ts-expect-error https://thymikee.github.io/jest-preset-angular/docs/getting-started/test-environment
globalThis.ngJest = {
  testEnvironmentOptions: {
    errorOnUnknownElements: true,
    errorOnUnknownProperties: true,
  },
};

setupZoneTestEnv();

jest.mock("tailwindcss/colors", () => ({
  __esModule: true,
  default: {
    sky: { 500: "#sky" },
    orange: { 400: "#orange", 500: "#orange500" },
    red: { 500: "#red", 600: "#red600" },
    green: { 500: "#green" },
    blue: { 500: "#blue" },
    emerald: { 500: "#emerald" },
    violet: { 500: "#violet" },
    amber: { 500: "#amber" },
    rose: { 500: "#rose" },
    cyan: { 500: "#cyan" },
    teal: { 500: "#teal" },
    indigo: { 500: "#indigo" },
    lime: { 500: "#lime" },
  },
}));
