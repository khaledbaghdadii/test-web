import { FormControl } from "@angular/forms";
import { SelectedGroup } from "@mxflow/features/infra-management";
import { EnvironmentDefinition } from "@mxflow/features/environment";

export interface SyncFinalProductForm {
  infraGroup: FormControl<SelectedGroup | null>;
  environmentDefinitions: FormControl<EnvironmentDefinition[] | null>;
  storageType: FormControl<"nfs" | "nexus3">;
  packageName: FormControl<string | null>;
  directoryName: FormControl<string | null>;
  groupId: FormControl<string>;
  artifactId: FormControl<string>;
  version: FormControl<string | null>;
  classifier: FormControl<string | null>;
  lightPackage: FormControl<boolean>;
}
