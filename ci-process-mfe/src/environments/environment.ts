import { EnvConfig } from "@mxflow/config";
import { Injectable } from "@angular/core";

const config = (window as unknown as EnvConfig).env;
const remoteEntryFileName = `remoteEntry.js?t=${Date.now()}`;
export const environment = {
  testMfeUrl: `${
    config?.local ? "http://localhost:4202" : config?.baseUrl
  }/test/${remoteEntryFileName}`,
  scmMfeUrl: `${
    config?.local ? "http://localhost:4208" : config?.baseUrl
  }/scm/${remoteEntryFileName}`,
  gatewayUrl: `${config?.baseUrl}/gateway/api/v1/`,
  production: config?.production,
  agGridChartLicenseKey: config?.agGridChartLicenseKey,

};

@Injectable({ providedIn: "root" })
export class EnvironmentProvider {
  getEnvironment(): any {
    return environment;
  }
}
