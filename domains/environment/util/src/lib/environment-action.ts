export enum EnvironmentAction {
  /** Available as a dropdown item when CLIENT or SECURE_CLIENT is supported; not used as a separate check */
  MONITOR_SERVICES = "MONITOR_SERVICES",
  SECURE_CLIENT = "SECURE_CLIENT",
  CLIENT = "CLIENT",
  WEB_CLIENT = "WEB_CLIENT",
}
