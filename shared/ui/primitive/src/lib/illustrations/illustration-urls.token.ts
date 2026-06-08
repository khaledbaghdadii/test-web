import { InjectionToken } from "@angular/core";

/**
 * Base path for illustration SVG assets.
 *
 * Provide this token in your app config so that `<mxevolve-illustration>`
 * can resolve illustrations by name. The component builds the URL as
 * `${basePath}/${name}.svg`.
 *
 * ```ts
 * providers: [
 *   { provide: ILLUSTRATIONS_PATH, useValue: 'assets/illustrations' },
 * ]
 * ```
 *
 * Then `<mxevolve-illustration name="order_delivered">` loads
 * `assets/illustrations/order_delivered.svg`.
 */
export const ILLUSTRATIONS_PATH = new InjectionToken<string>(
  "ILLUSTRATIONS_PATH"
);
