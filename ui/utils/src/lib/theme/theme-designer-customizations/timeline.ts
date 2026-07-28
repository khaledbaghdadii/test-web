import type { TimelineDesignTokens } from "@primeuix/themes/types/timeline";

export default {
  event: {
    minHeight: "5.0rem",
  },
  horizontal: {
    eventContent: {
      padding: "16px 0",
    },
  },
  vertical: {
    eventContent: {
      padding: "0.0rem 1.0rem",
    },
  },
  eventMarker: {
    size: "1.0rem",
    borderRadius: "50%",
    borderWidth: "2px",
    background: "{content.background}",
    borderColor: "{content.border.color}",
    content: {
      borderRadius: "50%",
      size: "0.5rem",
      background: "{primary.color}",
      insetShadow:
        "0 0.5px 0 0 rgba(0, 0, 0, 0.06),0 1px 1px 0 rgba(0, 0, 0, 0.12)",
    },
  },
  eventConnector: {
    color: "{content.border.color}",
    size: "2px",
  },
} satisfies TimelineDesignTokens;
