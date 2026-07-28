import type { EditorDesignTokens } from "@primeuix/themes/types/editor";

export default {
  toolbar: {
    background: "{content.background}",
    borderColor: "{content.border.color}",
    borderRadius: "{content.border.radius}",
  },
  toolbarItem: {
    color: "{text.muted.color}",
    hoverColor: "{text.color}",
    activeColor: "{primary.color}",
  },
  overlay: {
    background: "{overlay.select.background}",
    borderColor: "{overlay.select.border.color}",
    borderRadius: "{overlay.select.border.radius}",
    color: "{overlay.select.color}",
    shadow: "{overlay.select.shadow}",
    padding: "4px 4px",
  },
  overlayOption: {
    focusBackground: "{list.option.focus.background}",
    color: "{list.option.color}",
    focusColor: "{list.option.focus.color}",
    padding: "8px 12px",
    borderRadius: "{list.option.border.radius}",
  },
  content: {
    background: "{content.background}",
    borderColor: "{content.border.color}",
    color: "{content.color}",
    borderRadius: "{content.border.radius}",
  },
} satisfies EditorDesignTokens;
