import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from "@angular/core";

import { Dialog } from "primeng/dialog";
import {
  DropdownDefaultSelectionMode,
  FinalProduct,
  FinalProductDropdownInputComponent,
  FinalProductDropdownInputLabelMode,
} from "@mxflow/features/artifact-manager";
import { EnvironmentSelectInputModule } from "@mxflow/features/environment";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { GroupSelectionDropdownModule } from "@mxflow/features/infra-management";
import { MaintenanceLevelDropdownComponent } from "../../maintenance-level-dropdown/maintenance-level-dropdown.component";
import { MandatoryModule } from "@mxflow/directive";
import {
  FinalProductReseedDetails,
  LaunchTechnicalReseedOperationRequest,
} from "../technical-reseed-models";
import { TechnicalReseedService } from "../service/technical-reseed.service";
import { Subject, takeUntil } from "rxjs";

@Component({
  selector: "mxevolve-launch-technical-reseed-modal",
  imports: [
    Dialog,
    FinalProductDropdownInputComponent,
    EnvironmentSelectInputModule,
    ReactiveFormsModule,
    MandatoryModule,
    GroupSelectionDropdownModule,
    MaintenanceLevelDropdownComponent,
  ],
  templateUrl: "./launch-technical-reseed-modal.component.html",
  standalone: true,
})
export class LaunchTechnicalReseedModalComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();

  @Input({ required: true }) executionGroupId: string;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) infraGroup: string;
  @Input({ required: true }) targetBranch: string;
  @Input() modalOpen: boolean;
  @Output() modalOpenChange = new EventEmitter<boolean>();
  @Output() operationLaunched = new EventEmitter<{
    error?: string;
    summary?: string;
  }>();

  labelMode: FinalProductDropdownInputLabelMode;
  dropdownSelectionMode: DropdownDefaultSelectionMode;
  technicalReseedLaunchForm!: FormGroup;
  selectedFinalProduct: FinalProductReseedDetails;

  formBuilder = inject(FormBuilder);
  technicalReseedService = inject(TechnicalReseedService);

  @ViewChild(FinalProductDropdownInputComponent)
  finalProductDropdownComponent: FinalProductDropdownInputComponent;

  ngOnInit(): void {
    this.labelMode = FinalProductDropdownInputLabelMode.TAG_COMMIT_ID;
    this.dropdownSelectionMode = DropdownDefaultSelectionMode.CUSTOM;
    this.technicalReseedLaunchForm = this.formBuilder.group({
      finalProduct: [null, [Validators.required]],
      environmentDefinitionId: new FormControl<string | null>(null, [
        Validators.required,
      ]),
      maintenanceConfiguration: [null, [Validators.required]],
    });

    this.selectedFinalProduct = {
      branch: "",
      configurationCommitId: "",
      validationLevel: "",
    };
  }

  closeModal() {
    this.modalOpen = false;
    this.modalOpenChange.emit(this.modalOpen);
    this.technicalReseedLaunchForm.reset();
    this.finalProductDropdownComponent.clearSelectedOption();
  }

  handleSelectedFinalProduct(finalProduct: FinalProduct | undefined) {
    if (finalProduct) {
      this.selectedFinalProduct.branch = finalProduct?.branch;
      this.selectedFinalProduct.configurationCommitId =
        finalProduct?.configurationCommitId;
      this.selectedFinalProduct.validationLevel = finalProduct?.validationLevel;
      this.technicalReseedLaunchForm.patchValue({
        finalProduct: finalProduct?.id,
      });
    }
  }

  onSubmit() {
    this.technicalReseedService
      .launchTechnicalReseed(
        this.projectId,
        this.executionGroupId,
        this.buildRequest()
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.operationLaunched.emit();
          this.closeModal();
        },
        error: (err: Error) => {
          const errorPayload = {
            error: err.message,
            summary: "Failed to launch technical reseed operation",
          };
          this.operationLaunched.emit(errorPayload);
          this.closeModal();
        },
      });
  }

  private buildRequest(): LaunchTechnicalReseedOperationRequest {
    return {
      branch: this.selectedFinalProduct?.branch,
      configurationCommitId: this.selectedFinalProduct?.configurationCommitId,
      validationLevel: this.selectedFinalProduct?.validationLevel,
      environmentDefinitionId: this.technicalReseedLaunchForm.get(
        "environmentDefinitionId"
      )?.value,
      maintenanceConfiguration: this.technicalReseedLaunchForm.get(
        "maintenanceConfiguration"
      )?.value,
      infraGroupId: this.infraGroup,
      targetBranch: this.targetBranch,
    } as LaunchTechnicalReseedOperationRequest;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }
}
