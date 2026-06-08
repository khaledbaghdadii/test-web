import { CommonModule } from "@angular/common";
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from "@angular/core";
import {
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { MandatoryFieldModule, ToastMessageService } from "@mxflow/ui/alert";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { TooltipModule } from "primeng/tooltip";
import {
  FinalProduct,
  FinalProductDropdownInputComponent,
} from "@mxflow/features/artifact-manager";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { WhitespaceValidators } from "@mxflow/validator";
import { Store } from "@ngrx/store";
import { Subject, takeUntil, finalize } from "rxjs";
import { RepushScenarioExecutionFromFinalProductRequest } from "../request/repush-scenario-execution-from-final-product-request";
import { ScenarioExecutionService } from "../scenario-execution.service";
import { SkeletonModule } from "primeng/skeleton";
import { SelectModule } from "primeng/select";
import { KeepServicesCheckboxComponent } from "../actions/repush/keep-services-checkbox/keep-services-checkbox.component";
import { RepositoryService } from "@mxflow/features/repository";
import { MessageModule } from "primeng/message";

@Component({
  selector: "mxevolve-scenario-execution-repush-from-final-product-modal",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MandatoryFieldModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    FinalProductDropdownInputComponent,
    SkeletonModule,
    SelectModule,
    MessageModule,
    KeepServicesCheckboxComponent,
  ],
  providers: [
    Store,
    UntypedFormBuilder,
    ScenarioExecutionService,
    ToastMessageService,
  ],
  templateUrl: "./scenario-execution-repush-from-final-product.component.html",
})
export class ScenarioExecutionRepushFromFinalProductModalComponent
  implements OnInit
{
  private readonly store = inject(Store);
  private readonly formBuilder = inject(UntypedFormBuilder);
  private readonly scenarioExecutionService = inject(ScenarioExecutionService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly repositoryService = inject(RepositoryService);

  private readonly destroy$ = new Subject();

  showModal = false;
  isButtonLoading = false;
  isFormLoading = false;
  projectId: string;
  scenarioExecutionRepushForm: UntypedFormGroup;
  branch: string;
  initialFinalProductId: string;
  finalProductWarningMessage: string;
  isKeptExecution = false;
  keepServices?: boolean;
  repositoryId: string;

  @Input() enableKeepServices?: boolean = false;
  @Input() disableKeepExecution: boolean = false;
  @Input() warningMessage?: string;

  @Output() scenarioRepushed = new EventEmitter();
  input: ScenarioExecutionRepushFromFinalProductInput;

  ngOnInit(): void {
    this.scenarioExecutionRepushForm = this.formBuilder.group({
      finalProductId: [
        null,
        [Validators.required, WhitespaceValidators.notBlank()],
      ],
      rtpCommitId: [
        null,
        [Validators.required, WhitespaceValidators.noWhitespaces()],
      ],
    });
  }

  openModal(input: ScenarioExecutionRepushFromFinalProductInput) {
    this.input = input;
    this.isKeptExecution = input.keptExecution;
    this.showModal = true;
    this.setProjectId();
    this.setRepositoryId();
    this.isFormLoading = true;
    this.branch = input.branch;
    this.initialFinalProductId = input.initialFinalProductId;
  }

  private setProjectId() {
    this.store.select(GlobalSelectors.getProjectId).subscribe((value) => {
      this.projectId = value;
    });
  }

  private setRepositoryId() {
    this.repositoryService
      .getAllRepositories(this.projectId)
      .subscribe((repositories) => {
        this.repositoryId = repositories[0].id;
      });
  }

  closeModal() {
    this.showModal = false;
  }

  submitRepush() {
    this.isButtonLoading = true;
    this.scenarioExecutionService
      .repushScenarioExecutionFromFinalProduct(
        this.projectId,
        this.input.scenarioExecutionId,
        this.buildRepushRequest()
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isButtonLoading = false))
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.toastMessageService.showSuccess(
            "Scenario execution successfully repushed."
          );
          this.scenarioRepushed.emit();
        },
        error: () => {
          this.toastMessageService.showError(
            "Failed to repush scenario execution."
          );
        },
      });
  }

  onKeepServicesChanged(checked: boolean) {
    this.keepServices = checked;
  }

  handleDataReadyChange(isDataReady: boolean) {
    if (isDataReady && this.isFormLoading) {
      this.isFormLoading = false;
    }
  }

  handleSelectedFinalProductChange(finalProduct: FinalProduct | undefined) {
    if (!finalProduct) {
      this.resetFinalProductWarningMessage();
    }
    this.scenarioExecutionRepushForm
      .get("finalProductId")
      ?.setValue(finalProduct?.id);
    this.scenarioExecutionRepushForm
      .get("rtpCommitId")
      ?.setValue(finalProduct?.rtpProduct?.rtpCommitId);
  }

  private resetFinalProductWarningMessage() {
    this.finalProductWarningMessage = "";
  }

  handleErrorMessageChange(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }

  private buildRepushRequest(): RepushScenarioExecutionFromFinalProductRequest {
    return {
      finalProductId:
        this.scenarioExecutionRepushForm.get("finalProductId")?.value,
      rtpCommitId: this.getTrimmedFormField("rtpCommitId"),
      executionGroupId: this.input.executionGroupId,
      stopServices: !this.keepServices,
    } as RepushScenarioExecutionFromFinalProductRequest;
  }

  updateFinalProductWarningMessage(message: string) {
    this.finalProductWarningMessage = message;
  }

  private getTrimmedFormField(formField: string): string {
    const value = this.scenarioExecutionRepushForm.get(formField)?.value;
    return value ? value.trim() : "";
  }
}

export interface ScenarioExecutionRepushFromFinalProductInput {
  branch: string;
  initialFinalProductId: string;
  scenarioExecutionId: string;
  keptExecution: boolean;
  executionGroupId?: string;
}
