import { VersionType } from "../version/version-api-model";

export interface ClientImpactNoteAffectedVersionsConfigApiModel {
  allowedVersionTypes: VersionType[];
  allowedInactive: boolean;
}
