import type { ConfirmPopupDesignTokens } from "@primeuix/themes/types/confirmpopup";

export default {
  root: {
    background: "{overlay.popover.background}",
    borderColor: "{overlay.popover.border.color}",
    color: "{overlay.popover.color}",
    borderRadius: "{overlay.popover.border.radius}",
    shadow: "{overlay.popover.shadow}",
    gutter: "12px",
    arrowOffset: "1.0rem",
  },
  content: {
    padding: "{overlay.popover.padding}",
    gap: "1.0rem",
  },
  icon: {
    size: "1.5rem",
    color: "{overlay.popover.color}",
  },
  footer: {
    gap: "0.5rem",
    padding:
      "0 {overlay.popover.padding} {overlay.popover.padding} {overlay.popover.padding}",
  },
} satisfies ConfirmPopupDesignTokens;
