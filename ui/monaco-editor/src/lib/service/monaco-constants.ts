/**
 * Stable re-exports of monaco runtime enums. Hardcoded to their well-known
 * values so consumer modules don't have to pull the monaco runtime into their
 * own import graph just to reference a constant. Values mirror
 * `monaco.editor.ContentWidgetPositionPreference` /
 * `monaco.editor.OverviewRulerLane`.
 */
export const ContentWidgetPosition = {
  EXACT: 0,
  ABOVE: 1,
  BELOW: 2,
} as const;

export const OverviewRulerLane = {
  LEFT: 1,
  CENTER: 2,
  RIGHT: 4,
  FULL: 7,
} as const;
