import {
  LiteBinaryImpact,
  LiteBinaryRegression,
  LiteConfigurationImpact,
  LiteConfigurationRegression,
} from "@mxflow/features/failure-management";

export type Detection =
  | LiteBinaryImpact
  | LiteBinaryRegression
  | LiteConfigurationImpact
  | LiteConfigurationRegression;
