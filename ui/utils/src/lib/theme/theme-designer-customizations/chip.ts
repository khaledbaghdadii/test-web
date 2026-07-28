import type { ChipDesignTokens } from "@primeuix/themes/types/chip";

export default {
  root: {
    borderRadius: "16px",
    paddingX: "0.75rem",
    paddingY: "0.5rem",
    gap: "0.5rem",
    transitionDuration: "{transition.duration}",
  },
  image: {
    width: "1.5rem",
    height: "1.5rem",
  },
  icon: {
    size: "1.0rem",
  },
  removeIcon: {
    size: "1.0rem",
    focusRing: {
      width: "{focus.ring.width}",
      style: "{focus.ring.style}",
      color: "{focus.ring.color}",
      offset: "{focus.ring.offset}",
      shadow: "{form.field.focus.ring.shadow}",
    },
  },
  colorScheme: {
    light: {
      root: {
        background: "{surface.100}",
        color: "{surface.800}",
      },
      icon: {
        color: "{surface.800}",
      },
      removeIcon: {
        color: "{surface.800}",
      },
    },
    dark: {
      root: {
        background: "{surface.800}",
        color: "{surface.0}",
      },
      icon: {
        color: "{surface.0}",
      },
      removeIcon: {
        color: "{surface.0}",
      },
    },
  },
} satisfies ChipDesignTokens;
