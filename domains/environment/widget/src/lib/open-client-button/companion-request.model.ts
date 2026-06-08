export interface CompanionRequest {
  environmentId: string;
  launcher: string;
  host: string;
  port: number;
  clientPackageName: string;
  clientPackageUri: string;
  clientJarName: string;
  clientJarUri: string;
}

export interface SecureCompanionRequest {
  environmentId: string;
  launcher: string;
  secureClientArtifactUri: string;
}
