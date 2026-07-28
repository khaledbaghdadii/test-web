import type { FileUploadDesignTokens } from "@primeuix/themes/types/fileupload";

export default {
  root: {
    background: "{content.background}",
    borderColor: "{content.border.color}",
    color: "{content.color}",
    borderRadius: "{content.border.radius}",
    transitionDuration: "{transition.duration}",
  },
  header: {
    background: "transparent",
    color: "{text.color}",
    padding: "1.0rem",
    borderColor: "#00000000",
    borderWidth: "0",
    borderRadius: "0",
    gap: "0.5rem",
  },
  content: {
    highlightBorderColor: "{primary.color}",
    padding: "0.0rem 1.0rem 1.0rem 1.0rem",
    gap: "1.0rem",
  },
  file: {
    padding: "1.0rem",
    gap: "1.0rem",
    borderColor: "{content.border.color}",
    info: {
      gap: "0.5rem",
    },
  },
  fileList: {
    gap: "0.5rem",
  },
  progressbar: {
    height: "0.25rem",
  },
  basic: {
    gap: "0.5rem",
  },
} satisfies FileUploadDesignTokens;
