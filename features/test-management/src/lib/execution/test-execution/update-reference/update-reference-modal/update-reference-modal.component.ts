import {
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  Input,
  model,
  Output,
  signal,
} from "@angular/core";
import { StepperModule } from "primeng/stepper";
import {
  BinaryImpactsSelectionTableComponent,
  ConfigurationImpactsSelectionTableComponent,
  DetectionCategory,
  DetectionType,
  LiteBinaryImpact,
  LiteConfigurationImpact,
} from "@mxflow/features/failure-management";
import {
  BehaviorSubject,
  catchError,
  finalize,
  of,
  switchMap,
  tap,
} from "rxjs";
import { FormsModule } from "@angular/forms";
import { FileInfoRequest, ScmService } from "@mxflow/features/scm";

import { ToastMessageService } from "@mxflow/ui/alert";
import { AuthenticationService } from "@mxflow/core/auth";
import { UpdateReferenceService } from "../update-reference.service";
import {
  TriggerUpdateReferenceRequest,
  UpdateReferenceFileRequest,
} from "../trigger-update-reference-request";
import {
  AnalysisObjectSelectionState,
  AnalysisObjectSelectionType,
} from "@mxflow/features/analysis-objects";
import { Dialog } from "primeng/dialog";
import { TabsModule } from "primeng/tabs";
import { Button } from "primeng/button";
import { Message } from "primeng/message";
import { FloatLabel } from "primeng/floatlabel";
import { Textarea } from "primeng/textarea";
import { NgClass } from "@angular/common";
import {
  ShowDetectionWithNoDefectsToggleComponent,
  ValidationScope,
  ValidationScopeSetterComponent,
} from "@mxflow/features/validation-management";
import { TestManagementAnalyticsTrackerService } from "@mxevolve/domains/test/feature";

@Component({
  selector: "mxevolve-update-reference-modal",
  templateUrl: "./update-reference-modal.component.html",
  imports: [
    Dialog,
    Button,
    BinaryImpactsSelectionTableComponent,
    ConfigurationImpactsSelectionTableComponent,
    FloatLabel,
    Textarea,
    TabsModule,
    FormsModule,
    StepperModule,
    Message,
    NgClass,
    ShowDetectionWithNoDefectsToggleComponent,
    ValidationScopeSetterComponent,
    ShowDetectionWithNoDefectsToggleComponent,
  ],
  providers: [ScmService, UpdateReferenceService],
})
export class UpdateReferenceModalComponent {
  private readonly scmService = inject(ScmService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly authService = inject(AuthenticationService);
  private readonly updateReferenceService = inject(UpdateReferenceService);
  private readonly analyticsTrackerService = inject(
    TestManagementAnalyticsTrackerService
  );

  @Input({ required: true }) projectId: string;
  @Input({ required: true }) repositoryId: string;
  @Input({ required: true }) commitId: string;
  @Input({ required: true }) scenarioExecutionId: string;
  @Input({ required: true }) testExecutionId: string;
  @Input({ required: false }) testCaseExecutionId: string | undefined;
  @Input({ required: true }) referenceFilePathOnRepo: string;
  @Input({ required: true }) updatedReferenceFilePath: string;
  @Input() warningMessage?: string;
  showImpactsWithoutDefects = signal(false);
  validationScope = model<ValidationScope | undefined>(undefined);
  initialValidationScope = input<ValidationScope | undefined>(undefined);

  @Input()
  set isVisible(value: boolean) {
    this._isVisible = value;
    if (value) {
      this.initModal();
    }
    this.isVisibleChange.emit(value);
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  @Output() isVisibleChange = new EventEmitter();

  private _isVisible = false;
  refresh$ = new BehaviorSubject<boolean>(false);
  stepperValue = model<number>(1);
  userEmail: string;
  userName: string;
  tabIndex = model<string>("0");

  commitMessageSignal = model<string>("");
  selectedBinaryImpactsSignal = model<
    AnalysisObjectSelectionState<LiteBinaryImpact>[]
  >([]);
  selectedConfigurationImpactsSignal = model<
    AnalysisObjectSelectionState<LiteConfigurationImpact>[]
  >([]);
  canProceedToCommitStepSignal = computed(() => {
    return (
      this.selectedConfigurationImpactsSignal().length > 0 ||
      this.selectedBinaryImpactsSignal().length > 0
    );
  });

  initiallyLinkedBinaryImpactsState = signal<
    AnalysisObjectSelectionState<LiteBinaryImpact>[]
  >([]);

  initiallyLinkedConfigurationImpactsState = signal<
    AnalysisObjectSelectionState<LiteConfigurationImpact>[]
  >([]);

  canSubmitSignal = computed(() => {
    return this.commitMessageSignal().trim().length > 0;
  });
  configurationImpactsPreviewCommitMessageSignal = computed(() => {
    if (this.selectedConfigurationImpactsSignal().length > 0) {
      const configurationImpactTitles =
        this.selectedConfigurationImpactsSignal().map(
          (item) => item.analysisObject.title
        );
      return ` -Configuration Impacts: ${configurationImpactTitles.join(", ")}`;
    } else {
      return "";
    }
  });
  binaryImpactsPreviewCommitMessageSignal = computed(() => {
    if (this.selectedBinaryImpactsSignal().length > 0) {
      const ids = this.selectedBinaryImpactsSignal().map((item) => {
        const impact = item.analysisObject;
        return impact.upgradeImpact?.externalIssue?.id ?? impact.title;
      });
      return ` -Binary Impacts: ${ids.join(", ")}`;
    } else {
      return "";
    }
  });
  computedCommitMessageSignal = computed(() => {
    return this.commitMessageSignal()
      .trim()
      .concat(this.configurationImpactsPreviewCommitMessageSignal())
      .concat(this.binaryImpactsPreviewCommitMessageSignal());
  });
  selectedConfigurationImpactsIdsSignal = computed(() => {
    return this.selectedConfigurationImpactsSignal().map((item) => {
      return item.analysisObject.id;
    });
  });
  selectedBinaryImpactsIdsSignal = computed(() => {
    return this.selectedBinaryImpactsSignal().map((item) => {
      return item.analysisObject.id;
    });
  });

  constructor() {
    this.userEmail = this.authService.getUserMail();
    this.userName = this.authService.getUsername();
  }

  initModal() {
    this.commitMessageSignal.set("");
    this.selectedBinaryImpactsSignal.set([]);
    this.selectedConfigurationImpactsSignal.set([]);
    this.refresh$.next(true);
    this.stepperValue.set(1);
    this.tabIndex.set("0");
  }

  submit(): void {
    this.analyticsTrackerService.trackUpdateReference();
    this.checkForFileExistence()
      .pipe(
        switchMap((fileInfoResponse) => {
          if (fileInfoResponse?.fileExists) {
            return this.triggerUpdateReference();
          } else {
            return of(null);
          }
        }),
        finalize(() => {
          this.isVisible = false;
        })
      )
      .subscribe();
  }

  private triggerUpdateReference() {
    return this.updateReferenceService
      .trigger(this.createUpdateReferenceRequest())
      .pipe(
        tap(() => {
          this.toastMessageService.showSuccess(
            "The update reference has been triggered successfully!"
          );
        }),
        catchError((error) => {
          this.toastMessageService.showError(
            "Failed to update reference: " + error
          );
          return of(null);
        })
      );
  }

  private checkForFileExistence() {
    return this.scmService.getFileInfo(this.createFileInfoRequest()).pipe(
      tap((response) => {
        if (!response.fileExists) {
          this.toastMessageService.showError(
            "File does not exist on the repository!"
          );
        }
      }),
      catchError((error) => {
        this.toastMessageService.showError(
          "Could not fetch file information from the repository: " + error
        );
        return of(null);
      })
    );
  }

  private createUpdateReferenceRequest() {
    return {
      projectId: this.projectId,
      scenarioExecutionId: this.scenarioExecutionId,
      testExecutionId: this.testExecutionId,
      testCaseExecutionId: this.testCaseExecutionId,
      commitMessage: this.computedCommitMessageSignal(),
      binaryImpactIds: this.selectedBinaryImpactsIdsSignal(),
      configurationImpactIds: this.selectedConfigurationImpactsIdsSignal(),
      referenceToUpdate: this.createUpdateReferenceFileRequest(),
    } as TriggerUpdateReferenceRequest;
  }

  private createUpdateReferenceFileRequest() {
    return {
      referenceFilePathOnRepo: this.referenceFilePathOnRepo,
      updatedReferenceFilePath: this.updatedReferenceFilePath,
    } as UpdateReferenceFileRequest;
  }

  private createFileInfoRequest(): FileInfoRequest {
    return {
      projectId: this.projectId,
      repositoryId: this.repositoryId,
      version: this.commitId,
      path: this.referenceFilePathOnRepo,
    } as FileInfoRequest;
  }

  onBackClicked(): void {
    this.stepperValue.set(1);
    this.refresh$.next(true);
  }

  onNextClicked(): void {
    this.stepperValue.set(2);
    this.updateInitialSelections();
  }

  private updateInitialSelections() {
    this.setInitiallyLinkedBinaryImpactsStateToCurrentSelection();
    this.setInitiallyLinkedConfigurationImpactsStateToCurrentSelection();
  }

  private setInitiallyLinkedBinaryImpactsStateToCurrentSelection() {
    this.initiallyLinkedBinaryImpactsState.set(
      this.selectedBinaryImpactsSignal().map((selectionState) => {
        return {
          ...selectionState,
          selectionType: AnalysisObjectSelectionType.FULL,
        };
      })
    );
  }

  private setInitiallyLinkedConfigurationImpactsStateToCurrentSelection() {
    this.initiallyLinkedConfigurationImpactsState.set(
      this.selectedConfigurationImpactsSignal().map((selectionState) => {
        return {
          ...selectionState,
          selectionType: AnalysisObjectSelectionType.FULL,
        };
      })
    );
  }

  onModalClose() {
    this.stepperValue.set(1);
  }

  handleWarningMessage(warningMessage?: string) {
    this.warningMessage = warningMessage;
  }

  protected readonly DetectionType = DetectionType;
  protected readonly DetectionCategory = DetectionCategory;
}
