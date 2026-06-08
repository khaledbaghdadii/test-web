import { Component, computed, DestroyRef, inject, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";
import { MandatoryModule } from "@mxflow/directive";
import { MandatoryFieldModule } from "@mxflow/ui/alert";
import { Button } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { FinalProductStateService } from "../service/final-product-state.service";
import {
  GroupSelectionDropdownModule,
  InfraGroupsService,
} from "@mxflow/features/infra-management";
import { Select } from "primeng/select";
import { SyncFinalProductFormComponentService } from "./service/sync-final-product-form-component.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Tooltip } from "primeng/tooltip";
import { EnvironmentDefinition } from "../../../../../environment/src/lib/environment-definition";
import { EnvironmentMultiSelectInputComponent } from "../../../../../environment/src/lib/environment-multi-select-input/environment-multi-select-input.component";

@Component({
  standalone: true,
  imports: [
    DialogModule,
    Button,
    MandatoryFieldModule,
    FormsModule,
    InputTextModule,
    MandatoryModule,
    ReactiveFormsModule,
    GroupSelectionDropdownModule,
    Select,
    ToggleSwitch,
    Tooltip,
    EnvironmentMultiSelectInputComponent,
  ],
  providers: [InfraGroupsService, SyncFinalProductFormComponentService],
  templateUrl: "./sync-final-product-form.component.html",
  selector: "mxevolve-sync-final-product-form",
})
export class SyncFinalProductFormComponent implements OnInit {
  finalProductStateService = inject(FinalProductStateService);
  fb = inject(FormBuilder);
  destroyRef = inject(DestroyRef);
  syncFinalProductFormService = inject(SyncFinalProductFormComponentService);
  syncFinalProductForm: FormGroup;
  visible = false;
  isLoading = this.finalProductStateService.isSyncFinalProductLoading;
  isSyncFinalProductModalOpen =
    this.finalProductStateService.isSyncFinalProductModalOpen;
  finalProduct = this.finalProductStateService.selectedFinalProductToBeSynced;
  projectId = computed(() => {
    return this.finalProduct()?.projectId ?? "";
  });
  readonly supportedStorageTypes = [
    { label: "NFS", value: "nfs" },
    { label: "Nexus", value: "nexus3" },
  ];
  readonly lightPackageInfoMessage =
    "Selecting this option will only sync the client configurations without the factory product artifacts.";

  ngOnInit(): void {
    this.initSyncFinalProductForm();
  }

  private initSyncFinalProductForm() {
    this.syncFinalProductForm = this.syncFinalProductFormService.initializeForm(
      this.finalProduct()
    );
    this.syncFinalProductFormService.applyFormValidators(
      this.syncFinalProductForm
    );
    this.syncFinalProductFormService.subscribeToDestinationStorageTypeChanges(
      this.syncFinalProductForm
    );
  }

  syncFinalProduct() {
    this.syncFinalProductFormService
      .syncFinalProduct(this.finalProduct(), this.syncFinalProductForm)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.closeSyncFinalProductForm(),
      });
  }

  showForm() {
    this.resetSyncFinalProductForm();
    this.visible = true;
  }

  closeSyncFinalProductForm() {
    this.finalProductStateService.setIsSyncFinalProductModalOpen(false);
    this.resetSyncFinalProductForm();
    this.finalProductStateService.setSelectedFinalProductToBeSynced(undefined);
  }

  resetSyncFinalProductForm() {
    this.syncFinalProductForm.reset();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.syncFinalProductForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onEnvironmentDefinitionSelected(
    selectedEnvironments: EnvironmentDefinition[]
  ) {
    this.syncFinalProductFormService.setClassifier(
      this.syncFinalProductForm,
      selectedEnvironments
    );
  }
}
