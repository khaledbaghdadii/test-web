import { InjectionToken } from "@angular/core";

/**
 * Base path for custom SVG icon assets.
 *
 * Provide this token in your app config so that `<mxevolve-icon>` can
 * resolve custom SVG icons by name. The component builds the URL as
 * `${basePath}/${name}.svg`.
 *
 * ```ts
 * providers: [
 *   { provide: CUSTOM_ICONS_PATH, useValue: 'assets/icons' },
 * ]
 * ```
 *
 * Then `<mxevolve-icon name="murex_logo_ball">` loads `assets/icons/murex_logo_ball.svg`.
 */
export const CUSTOM_ICONS_PATH = new InjectionToken<string>(
  "CUSTOM_ICONS_PATH"
);
