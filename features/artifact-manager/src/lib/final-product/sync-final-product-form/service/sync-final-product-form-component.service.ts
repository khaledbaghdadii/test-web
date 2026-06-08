import { DestroyRef, inject, Injectable } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, EMPTY, Observable, throwError } from "rxjs";
import { FinalProduct } from "@mxflow/features/artifact-manager";
import { FinalProductStateService } from "../../service/final-product-state.service";
import { SelectedGroup } from "@mxflow/features/infra-management";
import { SyncFinalProductForm } from "../model/sync-final-product-form";
import { EnvironmentDefinition } from "@mxflow/features/environment";
import { SyncFinalProductApiRequest } from "../../model/sync-final-product-api-request";
import { noSpacesValidator } from "../../../shared/custom-validators/no-space-validators";

@Injectable()
export class SyncFinalProductFormComponentService {
  destroyRef = inject(DestroyRef);
  formBuilder = inject(FormBuilder);
  finalProductStateService = inject(FinalProductStateService);
  readonly defaultStorageType = "nfs";
  readonly defaultGroupId = "murex";
  readonly defaultArtifactId = "finalproduct";
  readonly EMPTY_SPACES_REGEX = /\s+/g;
  readonly MAX_CLASSIFIER_LENGTH = 128;

  initializeForm(
    finalProduct: { version: string } | undefined
  ): FormGroup<SyncFinalProductForm> {
    return this.formBuilder.group<SyncFinalProductForm>({
      storageType: new FormControl<"nexus3" | "nfs">(this.defaultStorageType, {
        validators: [Validators.required],
        nonNullable: true,
      }),
      packageName: new FormControl<string | null>(null),
      directoryName: new FormControl<string | null>(null),
      infraGroup: new FormControl<SelectedGroup | null>(null, [
        Validators.required,
      ]),
      environmentDefinitions: new FormControl<EnvironmentDefinition[] | null>(
        null,
        [Validators.required]
      ),
      groupId: new FormControl<string>(
        {
          value: this.defaultGroupId,
          disabled: true,
        },
        { nonNullable: true }
      ),
      artifactId: new FormControl<string>(
        {
          value: this.defaultArtifactId,
          disabled: true,
        },
        { nonNullable: true }
      ),
      version: new FormControl<string | null>(finalProduct?.version ?? null),
      classifier: new FormControl<string | null>(null),
      lightPackage: new FormControl<boolean>(false, { nonNullable: true }),
    });
  }

  applyFormValidators(formGroup: FormGroup<SyncFinalProductForm>): void {
    const directoryNameControl = formGroup.controls.directoryName;
    const packageNameControl = formGroup.controls.packageName;
    const groupIdControl = formGroup.controls.groupId;
    const artifactIdControl = formGroup.controls.artifactId;
    const versionControl = formGroup.controls.version;

    if (formGroup.controls.storageType.value === "nfs") {
      directoryNameControl.setValidators([noSpacesValidator()]);
      packageNameControl.setValidators([noSpacesValidator()]);
      groupIdControl.clearValidators();
      artifactIdControl.clearValidators();
      versionControl.clearValidators();
    } else {
      directoryNameControl.clearValidators();
      packageNameControl.clearValidators();
      groupIdControl.setValidators([Validators.required]);
      artifactIdControl.setValidators([Validators.required]);
      versionControl.setValidators([Validators.required]);
    }

    directoryNameControl.updateValueAndValidity();
    packageNameControl.updateValueAndValidity();
    groupIdControl.updateValueAndValidity();
    artifactIdControl.updateValueAndValidity();
    versionControl.updateValueAndValidity();
  }

  subscribeToDestinationStorageTypeChanges(formGroup: FormGroup) {
    formGroup
      .get("storageType")
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyFormValidators(formGroup);
      });
  }

  syncFinalProduct(
    finalProduct: FinalProduct | undefined,
    syncFinalProductForm: FormGroup
  ): Observable<void> {
    if (finalProduct !== undefined && syncFinalProductForm.valid) {
      const request: SyncFinalProductApiRequest =
        this.buildSyncFinalProductRequest(syncFinalProductForm);
      return this.finalProductStateService
        .syncFinalProduct(finalProduct.projectId, finalProduct.id, request)
        .pipe(
          catchError(() => EMPTY),
          takeUntilDestroyed(this.destroyRef)
        );
    }
    return throwError(
      () =>
        new Error(
          "Could not submit form to sync final product: form is invalid or no final product is selected"
        )
    );
  }

  private buildSyncFinalProductRequest(
    syncFinalProductForm: FormGroup
  ): SyncFinalProductApiRequest {
    const storageType = syncFinalProductForm.get("storageType")?.value;
    return {
      infraGroupId: syncFinalProductForm.get("infraGroup")?.value?.id,
      environmentDefinitionIds:
        syncFinalProductForm
          .get("environmentDefinitions")
          ?.value?.map((def: EnvironmentDefinition) => def.id) ?? [],
      lightPackage: syncFinalProductForm.get("lightPackage")?.value === true,
      destinationMetadata:
        storageType === "nfs"
          ? {
              storageType: "nfs",
              packageName: syncFinalProductForm.get("packageName")?.value,
              directoryName: syncFinalProductForm.get("directoryName")?.value,
            }
          : {
              storageType: "nexus3",
              groupId: syncFinalProductForm.get("groupId")?.value,
              artifactId: syncFinalProductForm.get("artifactId")?.value,
              version: syncFinalProductForm.get("version")?.value,
              classifier: syncFinalProductForm.get("classifier")?.value,
            },
    };
  }

  setClassifier(
    syncFinalProductForm: FormGroup<SyncFinalProductForm>,
    selectedEnvironmentDefinition: EnvironmentDefinition[]
  ) {
    syncFinalProductForm.patchValue({
      classifier: selectedEnvironmentDefinition.length
        ? this.toClassifier(selectedEnvironmentDefinition)
        : null,
    });
  }

  private toClassifier(environmentDefinitions: EnvironmentDefinition[]) {
    return environmentDefinitions
      .map((def) =>
        def.name.trim().toLowerCase().replace(this.EMPTY_SPACES_REGEX, "_")
      )
      .join("_")
      .substring(0, this.MAX_CLASSIFIER_LENGTH);
  }
}
