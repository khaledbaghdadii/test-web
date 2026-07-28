export default {
  // There is a bug in the Theme Designer that causes the "info blue" color to be missing from the generated JSON
  // This is a workaround to add it back in.
  // Remove this when the bug is fixed
  primitive: {
    "info blue": {
      50: "#E6F6FB",
      100: "#CCECF7",
      200: "#99D9EE",
      300: "#66C6E6",
      400: "#33B3DD",
      500: "#00A0D5",
      600: "#0080AA",
      700: "#006080",
      800: "#00506B",
      900: "#003040",
      950: "#00202B",
    },
  },
};
