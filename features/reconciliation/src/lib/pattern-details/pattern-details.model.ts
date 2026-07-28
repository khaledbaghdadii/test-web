export interface PatternDetailsRootCause {
  id: number;
  displayName: string;
}
export interface PatternDetailsColumn {
  id: string;
  name: string;
  type: string;
}
export interface PatternDetails {
  id: number;
  title: string;
  description: string;
  createdInPackage: string;
  createdInCycleId: string;
  originalScript: string;
  linkedRootCauses: PatternDetailsRootCause[];
  impactedGroups: string[];
  differenceTypes: string[];
  ownerUserName: string;
  referencedColumns: PatternDetailsColumn[];
  deletable: boolean;
  editable: boolean;
  editedVersion: boolean;
  patternType: string;
  versionNumber: number;
  approved: boolean;
  patternInstanceId: string;
  unapplied: boolean;
}
