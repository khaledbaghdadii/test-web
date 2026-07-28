import type { TooltipDesignTokens } from "@primeuix/themes/types/tooltip";

export default {
  root: {
    maxWidth: "11.25rem",
    gutter: "0.25rem",
    shadow: "{overlay.popover.shadow}",
    padding: "0.5rem 1.0rem",
    borderRadius: "{overlay.popover.border.radius}",
  },
  colorScheme: {
    light: {
      root: {
        background: "{surface.700}",
        color: "{surface.0}",
      },
    },
    dark: {
      root: {
        background: "{surface.700}",
        color: "{surface.0}",
      },
    },
  },
} satisfies TooltipDesignTokens;
