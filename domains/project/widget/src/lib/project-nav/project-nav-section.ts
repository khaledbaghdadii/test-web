/** The three project navigation sections rendered by the section layout. */
export type ProjectNavSection = "assets" | "setup" | "settings";

/** Human-readable label for each section, used for the sidebar aria-label. */
export const SECTION_LABELS: Record<ProjectNavSection, string> = {
  assets: "Project Assets",
  setup: "Project Setup",
  settings: "Settings",
};
