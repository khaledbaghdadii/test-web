import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { Store } from "@ngrx/store";
import { CiProcessExecutionService } from "../../service/ci-process-execution.service";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { WhitespaceValidators } from "@mxflow/validator";
import { SendChangesForReviewRequest } from "../../service/model/send-changes-for-review-request";
import { ProceedWithPredefinedInputsRequest } from "../../service/model/proceed-with-predefined-inputs-request";
import {
  BuildAndTestProcessExecution,
  BusinessProcessDefinition,
  BusinessProcessDefinitionMultiSelectDropdownComponent,
} from "@mxflow/features/business-process";
import { BranchNameByDevelopmentPipe, Reviewer } from "@mxflow/features/scm";
import { getCiProcessExecution } from "../../state/ci-process-execution.selector";
import { Dialog } from "primeng/dialog";
import { MxflowSpinnerModule } from "@mxflow/ui/utils";
import { ErrorAlertComponent, MandatoryFieldModule } from "@mxflow/ui/alert";
import { InputText } from "primeng/inputtext";
import { AsyncPipe, NgTemplateOutlet } from "@angular/common";
import { Button } from "primeng/button";
import { PrimeTemplate } from "primeng/api";
import { Checkbox } from "primeng/checkbox";
import {
  DestinationBranchDropdownComponent,
  MergeConfigurationMultiSelectComponent,
  ReviewersAutoCompleteComponent,
} from "@mxflow/features/scm-management";
import { RadioButton } from "primeng/radiobutton";
import { BackportInput } from "../../service/model/backport-input";

@Component({
  selector: "mxflow-send-for-review",
  templateUrl: "./send-for-review.component.html",
  imports: [
    Dialog,
    MxflowSpinnerModule,
    ErrorAlertComponent,
    ReactiveFormsModule,
    MandatoryFieldModule,
    InputText,
    NgTemplateOutlet,
    Button,
    PrimeTemplate,
    BranchNameByDevelopmentPipe,
    AsyncPipe,
    Checkbox,
    MergeConfigurationMultiSelectComponent,
    RadioButton,
    ReviewersAutoCompleteComponent,
    DestinationBranchDropdownComponent,
    BusinessProcessDefinitionMultiSelectDropdownComponent,
  ],
})
export class SendForReviewComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject();

  @Input() projectId: string;
  @Input() processId: string;
  @Input() showModalEvenEmitter: EventEmitter<void>;
  @Input() hideModalEvenEmitter: EventEmitter<void>;
  @Output() mergeRequestCreated = new EventEmitter<void>();
  repositoryId: string;
  sendForReviewForm: FormGroup;

  destinationBranchFormController: FormControl;
  reviewerFormController: FormControl;
  deleteDevelopmentController: FormControl;
  backportMergeConfigurationFormController: FormControl;
  backportDefinitionsFormController: FormControl;
  hasPredefinedMergeRequestInputs = false;

  ciVersion: number;

  isModalVisible = false;
  submitLoading = false;
  destinationBranchLoading = true;
  backportDestinationBranchLoading = true;

  errorMessage: string;
  developmentId: string;
  configurationParentBranch: string;
  supportsResourceManagement = false;

  private readonly store = inject(Store);
  private readonly ciProcessService = inject(CiProcessExecutionService);
  private readonly formBuilder = inject(FormBuilder);

  ngOnInit() {
    this.createFormGroup();

    this.store
      .pipe(getCiProcessExecution)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (ciExecution: BuildAndTestProcessExecution) => {
          this.repositoryId = ciExecution.input.repositoryId;
          this.developmentId = ciExecution.createBranchStage.developmentId;
          this.supportsResourceManagement =
            ciExecution.supportsResourceManagement;
          this.ciVersion = ciExecution.ciVersion;
          this.hasPredefinedMergeRequestInputs =
            ciExecution.hasPredefinedMergeRequestInputs;
          this.configurationParentBranch =
            ciExecution.input.configurationParentBranch;
          if (this.hasPredefinedMergeRequestInputs) {
            this.destinationBranchLoading = false;
          }
        },
      });

    this.showModalEvenEmitter
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.isModalVisible = true));
    this.hideModalEvenEmitter
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.isModalVisible = false));
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private createFormGroup() {
    this.initializeForm();

    this.sendForReviewForm.controls["backport"].valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((backportValue) => {
        if (backportValue) {
          if (this.ciVersion === 1) {
            this.markBackportBranchesAsRequired();
          } else {
            this.markBackportDefinitionsAsRequired();
          }
        } else if (this.ciVersion === 1) {
          this.markBackportBranchesAsNotRequired();
        } else {
          this.markBackportDefinitionsAsNotRequired();
        }
      });
  }

  sendForReview() {
    if (this.hasPredefinedMergeRequestInputs) {
      this.submitLoading = true;
      this.ciProcessService
        .proceedWithPredefinedInputs(
          this.getProceedWithPredefinedInputsRequest()
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.mergeRequestCreated.emit();
            this.submitLoading = false;
          },
          error: (error) => {
            this.errorMessage = error.message;
            this.submitLoading = false;
          },
        });
    } else if (this.sendForReviewForm.valid) {
      this.submitLoading = true;
      this.ciProcessService
        .sendChangesForReview(this.getSendForReviewRequest())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.mergeRequestCreated.emit();
            this.submitLoading = false;
          },
          error: (error) => {
            this.errorMessage = error.message;
            this.submitLoading = false;
          },
        });
    } else {
      this.displayInvalidInputs();
    }
  }

  private getSendForReviewRequest(): SendChangesForReviewRequest {
    const definitions: BusinessProcessDefinition[] =
      this.sendForReviewForm.value.backportDefinitions || [];

    const backportInputs: BackportInput[] =
      this.extractBackportInputs(definitions);

    return {
      projectId: this.projectId,
      ciProcessExecutionId: this.processId,
      mergeConfigurationId: this.sendForReviewForm.value.destinationBranch.id,
      mergeJobTitle: this.sendForReviewForm.value.mergeRequestTitle,
      mergeJobReviewers: (
        this.sendForReviewForm.value.reviewer as { name: string }[]
      ).map((reviewer: { name: string }) => reviewer.name),
      backportChanges: this.sendForReviewForm.value.backport,
      backportMergeConfigurationIds: (
        this.sendForReviewForm.value.backportMergeConfigurations || []
      ).map((mergeConfig: { id: string }) => mergeConfig.id),
      backportInputs: backportInputs,
      shouldCleanDevelopment: this.sendForReviewForm.value.deleteDevelopment,
      developmentId: this.developmentId,
      supportsResourceManagement: this.supportsResourceManagement,
    };
  }

  private extractBackportInputs(
    definitions: BusinessProcessDefinition[]
  ): BackportInput[] {
    return definitions.map((definition) => {
      const getInput = (inputId: string): string => {
        const input = definition.providedInputs.find(
          (input) => input.inputId === inputId
        );
        return input?.value?.toString() || "";
      };

      return {
        definitionId: definition.id,
        repositoryId: getInput("repositoryId"),
        mergeConfigurationId: getInput("mergeConfigurationId"),
        buildAndTestInfraGroupId: getInput("buildAndTestInfraGroup"),
      };
    });
  }

  private getProceedWithPredefinedInputsRequest(): ProceedWithPredefinedInputsRequest {
    return {
      projectId: this.projectId,
      ciProcessExecutionId: this.processId,
      shouldCleanDevelopment: this.sendForReviewForm.value.deleteDevelopment,
      developmentId: this.developmentId,
      supportsResourceManagement: this.supportsResourceManagement,
    };
  }

  private displayInvalidInputs() {
    Object.values(this.sendForReviewForm.controls).forEach((control) => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  onCancel() {
    this.isModalVisible = false;
    this.resetForm();
  }

  destinationBranchError($event: string) {
    this.errorMessage = $event;
  }

  handleAutoCompleteError($event: string) {
    this.errorMessage = $event;
  }

  destinationBranchLoadingFinished() {
    this.destinationBranchLoading = false;
  }

  backportDestinationBranchError($event: string) {
    this.errorMessage = $event;
  }

  backportDestinationBranchLoadingFinished() {
    this.backportDestinationBranchLoading = false;
  }

  private markBackportBranchesAsNotRequired() {
    this.backportMergeConfigurationFormController.clearValidators();
    this.backportMergeConfigurationFormController.setValue([]);
    this.backportMergeConfigurationFormController.updateValueAndValidity();
  }

  private markBackportBranchesAsRequired() {
    this.backportMergeConfigurationFormController.setValue([]);
    this.backportMergeConfigurationFormController.setValidators([
      Validators.required,
    ]);
    this.backportMergeConfigurationFormController.updateValueAndValidity();
  }

  private markBackportDefinitionsAsNotRequired() {
    this.backportDefinitionsFormController.clearValidators();
    this.backportDefinitionsFormController.setValue([]);
    this.backportDefinitionsFormController.updateValueAndValidity();
  }

  private markBackportDefinitionsAsRequired() {
    this.backportDefinitionsFormController.setValue([]);
    this.backportDefinitionsFormController.setValidators([Validators.required]);
    this.backportDefinitionsFormController.updateValueAndValidity();
  }

  private initializeForm() {
    this.destinationBranchFormController = new FormControl<any>(null, [
      Validators.required,
    ]);
    this.backportMergeConfigurationFormController = new FormControl<
      Array<string>
    >([]);
    this.backportDefinitionsFormController = new FormControl<
      Array<BusinessProcessDefinition>
    >([]);
    this.reviewerFormController = new FormControl<Array<Reviewer>>([]);
    this.deleteDevelopmentController = new FormControl<boolean>(true);

    this.sendForReviewForm = this.formBuilder.group({
      mergeRequestTitle: [
        "",
        [
          Validators.required,
          Validators.maxLength(255),
          WhitespaceValidators.notBlank(),
        ],
      ],
      destinationBranch: this.destinationBranchFormController,
      reviewer: this.reviewerFormController,
      backport: [false, Validators.required],
      deleteDevelopment: this.deleteDevelopmentController,
      backportMergeConfigurations:
        this.backportMergeConfigurationFormController,
      backportDefinitions: this.backportDefinitionsFormController,
    });
  }

  private resetForm() {
    this.sendForReviewForm.reset({
      mergeRequestTitle: "",
      destinationBranch: null,
      reviewer: [],
      backport: false,
      backportMergeConfigurations: [],
      backportDefinitions: [],
      deleteDevelopment: true,
    });
  }
}
