import type { AvatarDesignTokens } from "@primeuix/themes/types/avatar";

export default {
  root: {
    width: "2.0rem",
    height: "2.0rem",
    fontSize: "1.0rem",
    background: "{content.border.color}",
    color: "{content.color}",
    borderRadius: "{content.border.radius}",
  },
  icon: {
    size: "1.0rem",
  },
  group: {
    borderColor: "{content.background}",
    offset: "-0.75rem",
  },
  lg: {
    width: "2.5rem",
    height: "2.5rem",
    fontSize: "1.5rem",
    icon: {
      size: "1.5rem",
    },
    group: {
      offset: "-1.0rem",
    },
  },
  xl: {
    width: "3.0rem",
    height: "3.0rem",
    fontSize: "1.5rem",
    icon: {
      size: "2.0rem",
    },
    group: {
      offset: "-1.5rem",
    },
  },
} satisfies AvatarDesignTokens;
