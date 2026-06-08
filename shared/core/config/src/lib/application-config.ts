import { InjectionToken } from "@angular/core";

export const GATEWAY_CONFIG = new InjectionToken<GatewayConfig>(
  "Gateway config"
);

export interface GatewayConfig {
  gatewayUrl: string;
}
