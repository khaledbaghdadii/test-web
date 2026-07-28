import type { ListboxDesignTokens } from "@primeuix/themes/types/listbox";

export default {
  root: {
    background: "{form.field.background}",
    disabledBackground: "{form.field.disabled.background}",
    borderColor: "{form.field.border.color}",
    invalidBorderColor: "{form.field.invalid.border.color}",
    color: "{form.field.color}",
    disabledColor: "{form.field.disabled.color}",
    shadow: "{form.field.shadow}",
    borderRadius: "{form.field.border.radius}",
    transitionDuration: "{form.field.transition.duration}",
  },
  list: {
    padding: "4px 4px",
    gap: "{list.gap}",
    header: {
      padding: "8px 12px 4px 12px",
    },
  },
  option: {
    focusBackground: "{list.option.focus.background}",
    selectedBackground: "{list.option.selected.background}",
    selectedFocusBackground: "{list.option.selected.focus.background}",
    color: "{list.option.color}",
    focusColor: "{list.option.focus.color}",
    selectedColor: "{list.option.selected.color}",
    selectedFocusColor: "{list.option.selected.focus.color}",
    padding: "8px 12px",
    borderRadius: "{list.option.border.radius}",
  },
  optionGroup: {
    background: "{list.option.group.background}",
    color: "{list.option.group.color}",
    fontWeight: "{list.option.group.font.weight}",
    padding: "8px 12px",
  },
  checkmark: {
    color: "{list.option.color}",
    gutterStart: "-0.5rem",
    gutterEnd: "0.5rem",
  },
  emptyMessage: {
    padding: "8px 12px",
  },
  colorScheme: {
    light: {
      option: {
        stripedBackground: "{surface.50}",
      },
    },
    dark: {
      option: {
        stripedBackground: "{surface.900}",
      },
    },
  },
} satisfies ListboxDesignTokens;
