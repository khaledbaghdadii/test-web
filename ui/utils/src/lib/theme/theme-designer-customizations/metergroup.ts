import type { MeterGroupDesignTokens } from "@primeuix/themes/types/metergroup";

export default {
  root: {
    borderRadius: "{content.border.radius}",
    gap: "1.0rem",
  },
  meters: {
    background: "{content.border.color}",
    size: "0.5rem",
  },
  label: {
    gap: "0.5rem",
  },
  labelMarker: {
    size: "0.5rem",
  },
  labelIcon: {
    size: "1.0rem",
  },
  labelList: {
    verticalGap: "0.5rem",
    horizontalGap: "1.0rem",
  },
} satisfies MeterGroupDesignTokens;
