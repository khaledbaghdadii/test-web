import { AbstractControl } from "@angular/forms";
import { BusinessProcessChain, Heaviness } from "@mxevolve/domains/test/model";

export interface CreateScenarioDefinitionForm {
  name: AbstractControl<string | null>;
  environmentDefinitionId: AbstractControl<string | null>;
  bpcs: AbstractControl<BusinessProcessChain[] | null>;
  heaviness: AbstractControl<Heaviness | null>;
  idempotent: AbstractControl<boolean | null>;
  nonFunctionalTest: AbstractControl<boolean | null>;
  qualityLevel: AbstractControl<string | null>;
}

export interface EditScenarioDefinitionForm {
  name: AbstractControl<string | null>;
  environmentDefinitionId: AbstractControl<string | null>;
  bpcs: AbstractControl<BusinessProcessChain[] | null>;
  heaviness: AbstractControl<Heaviness | null>;
  idempotent: AbstractControl<boolean | null>;
  nonFunctionalTest: AbstractControl<boolean | null>;
  qualityLevel: AbstractControl<string | null>;
}
