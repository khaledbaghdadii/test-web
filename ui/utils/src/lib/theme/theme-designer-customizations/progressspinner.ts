import type { ProgressSpinnerDesignTokens } from "@primeuix/themes/types/progressspinner";

export default {
  colorScheme: {
    light: {
      root: {
        colorOne: "{red.500}",
        colorTwo: "{info blue.500}",
        colorThree: "{green.500}",
        colorFour: "{amber.500}",
      },
    },
    dark: {
      root: {
        colorOne: "{red.400}",
        colorTwo: "{info blue.400}",
        colorThree: "{green.400}",
        colorFour: "{amber.400}",
      },
    },
  },
} satisfies ProgressSpinnerDesignTokens;
