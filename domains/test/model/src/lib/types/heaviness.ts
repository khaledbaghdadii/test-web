export const Heaviness = {
  NA: "NA",
  HEAVY: "HEAVY",
  LIGHT: "LIGHT",
};

export const PossibleHeaviness = [
  Heaviness.NA,
  Heaviness.HEAVY,
  Heaviness.LIGHT,
] as const;

export type Heaviness = (typeof PossibleHeaviness)[number] | undefined;
