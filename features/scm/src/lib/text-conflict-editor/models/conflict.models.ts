export interface RawConflictMatch {
  readonly startOffset: number;
  readonly endOffset: number;
  readonly current: string;
  readonly incoming: string;
  readonly raw: string;
}

export interface ConflictBlock extends RawConflictMatch {
  readonly id: string;
  readonly start: number;
  readonly end: number;
}

export interface ConflictMarkers {
  readonly start: number;
  readonly separator: number;
  readonly end: number;
}

export type ConflictResolution = "current" | "incoming" | "both";

export interface ConflictStatus {
  readonly total: number;
}

export const CONFLICT_REGEX =
  /<<<<<<< [^\n]*\n([\s\S]*?)(?:\n)?=======\n([\s\S]*?)(?:\n)?>>>>>>>[^\n]*\n?/g;

export const CONFLICT_CSS_CLASSES = {
  head: "conflict-marker conflict-marker--head",
  separator: "conflict-marker conflict-marker--separator",
  end: "conflict-marker conflict-marker--end",
  currentRange: "conflict-range conflict-range--current",
  incomingRange: "conflict-range conflict-range--incoming",
} as const;

export const CONFLICT_COLORS = {
  current: "rgba(40, 167, 69, 0.18)",
  incoming: "rgba(0, 123, 255, 0.18)",
  rulerCurrent: "#28a745",
  rulerIncoming: "#007bff",
  rulerConflict: "transparent",
} as const;
