export type EnvironmentTableAction =
  | "openClient"
  | "serviceActions"
  | "connectApplicative"
  | "connectToDatabase"
  | "copyToMxtest"
  | "details";

export interface EnvironmentTableActionsConfig {
  inline: EnvironmentTableAction[];
  menu: EnvironmentTableAction[];
}
