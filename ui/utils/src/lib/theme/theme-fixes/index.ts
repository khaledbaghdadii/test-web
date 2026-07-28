import type { Preset } from "@primeuix/themes/types";
import base from "./base";
import extend from "./extend";
export default {
  ...base,
  extend,
} satisfies Preset;
