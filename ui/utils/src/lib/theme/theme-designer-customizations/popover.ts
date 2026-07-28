import type { PopoverDesignTokens } from "@primeuix/themes/types/popover";

export default {
  root: {
    background: "{overlay.popover.background}",
    borderColor: "{overlay.popover.border.color}",
    color: "{overlay.popover.color}",
    borderRadius: "{overlay.popover.border.radius}",
    shadow: "{overlay.popover.shadow}",
    gutter: "16px",
    arrowOffset: "1.0rem",
  },
  content: {
    padding: "{overlay.popover.padding}",
  },
} satisfies PopoverDesignTokens;
