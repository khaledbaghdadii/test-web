import type { PanelDesignTokens } from "@primeuix/themes/types/panel";

export default {
  root: {
    background: "{content.background}",
    borderColor: "{content.border.color}",
    color: "{content.color}",
    borderRadius: "{content.border.radius}",
  },
  header: {
    background: "transparent",
    color: "{text.color}",
    padding: "1.0rem",
    borderColor: "{content.border.color}",
    borderWidth: "0",
    borderRadius: "0",
  },
  toggleableHeader: {
    padding: "0.25rem 1.0rem",
  },
  title: {
    fontWeight: "600",
  },
  content: {
    padding: "0.0rem 1.0rem 1.0rem 1.0rem",
  },
  footer: {
    padding: "0.0rem 1.0rem 1.0rem 1.0rem",
  },
} satisfies PanelDesignTokens;
