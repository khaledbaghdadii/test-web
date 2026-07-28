import type { DividerDesignTokens } from "@primeuix/themes/types/divider";

export default {
  root: {
    borderColor: "{content.border.color}",
  },
  content: {
    background: "{content.background}",
    color: "{text.color}",
  },
  horizontal: {
    margin: "16px 0",
    padding: "0",
    content: {
      padding: "0.0rem 0.5rem",
    },
  },
  vertical: {
    margin: "0.0rem 1.0rem",
    padding: "0",
    content: {
      padding: "8px 0",
    },
  },
} satisfies DividerDesignTokens;
