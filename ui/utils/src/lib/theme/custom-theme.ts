import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

import ThemeDesignerCustomizations from "./theme-designer-customizations";
import ThemeFixes from "./theme-fixes";
export const MXEvolveCustomTheme = definePreset(
  Aura,
  ThemeDesignerCustomizations,
  ThemeFixes
);

/* To update the custom theme with changes from Figma, you need to do the following:

1. Export the JSON file from Token Studio in figma and upload it to 
   the Theme Designer on the PrimeNG website as described here: https://primeng.org/designer/guide#tokensets
2. From the Theme Designer, Select the newly created theme and click on Download.
3. Delete the contents of the "theme-designer-customizations" folder and unzip the downloaded file into this folder
4. Fix for primeuix/themes: Replace all occurences of "@primeng/themes" with "@primeuix/themes"

*/
