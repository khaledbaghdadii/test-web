import {
  Component,
  EventEmitter,
  inject,
  input,
  Input,
  model,
  OnDestroy,
  Output,
  signal,
} from "@angular/core";

import { BinaryRegressionSelectionTableComponent } from "../binary-regression-selection-table/binary-regression-selection-table.component";
import {
  BehaviorSubject,
  filter,
  lastValueFrom,
  Observable,
  Subject,
  takeUntil,
} from "rxjs";
import {
  ShowDetectionWithNoDefectsToggleComponent,
  ValidationScope,
  ValidationScopeSetterComponent,
} from "@mxflow/features/validation-management";
import { ToastMessageService } from "@mxflow/ui/alert";
import { toObservable } from "@angular/core/rxjs-interop";
import { LiteBinaryRegression } from "../model/lite-binary-regression.model";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  BinaryRegressionLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { CreateBinaryRegressionButtonComponent } from "../create-binary-regression-button/create-binary-regression-button.component";
import { Message } from "primeng/message";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { FormsModule } from "@angular/forms";
import { DetectionCategory, DetectionType } from "../../detections";

@Component({
  selector: "mxevolve-link-binary-regression-modal-content",
  imports: [
    BinaryRegressionSelectionTableComponent,
    CreateBinaryRegressionButtonComponent,
    Message,
    FormsModule,
    ToggleSwitchModule,
    ValidationScopeSetterComponent,
    ShowDetectionWithNoDefectsToggleComponent,
  ],
  templateUrl: "./link-binary-regression-modal-content.component.html",
})
export class LinkBinaryRegressionModalContentComponent implements OnDestroy {
  private readonly toastMessageService = inject(ToastMessageService);

  destroy$ = new Subject<void>();
  private readonly binaryRegressionLinkingStateService = inject(
    BinaryRegressionLinkingStateService
  );

  refresh$ = new BehaviorSubject<boolean>(false);
  showBinaryRegressionsWithoutDefects = signal(false);
  isCreating = this.binaryRegressionLinkingStateService.isCreating;
  isLinking = this.binaryRegressionLinkingStateService.isLinking;

  @Input()
  initiallySelectedRegressions: AnalysisObjectSelectionState<AnalysisObject>[] =
    [];
  @Input({ required: true }) selectedRegressionIdsLoading: boolean;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) mxVersionInitialValue: string;
  @Input({ required: true }) createRegressionLink: (
    regressionId: string
  ) => Observable<null>;
  @Input() isSubmitButtonLoading = false;
  validationScope = model<ValidationScope | undefined>(undefined);
  initialValidationScope = input<ValidationScope | undefined>(undefined);
  @Input() warningMessage?: string;

  @Output() selectedBinaryRegressionsChange = new EventEmitter<
    AnalysisObjectSelectionState<AnalysisObject>[]
  >();

  constructor() {
    toObservable(this.isLinking)
      .pipe(
        filter((isLinking) => isLinking),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.refresh$.next(true);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBinaryRegressionSelectionChange(
    selectedRegressions: AnalysisObjectSelectionState<LiteBinaryRegression>[]
  ) {
    this.selectedBinaryRegressionsChange.emit(selectedRegressions);
  }

  showCreateBinaryRegressionModal() {
    this.binaryRegressionLinkingStateService.setIsCreating(true);
    this.binaryRegressionLinkingStateService.setIsLinking(false);
  }

  onCreateBinaryRegressionCancelled() {
    if (this.isCreating() || this.isLinking()) {
      this.binaryRegressionLinkingStateService.setIsCreating(false);
      this.binaryRegressionLinkingStateService.setIsLinking(true);
    }
  }

  async onBinaryRegressionCreated(binaryRegressionId: string) {
    await this.createLink(binaryRegressionId);
  }

  private createLink = async (id: string) => {
    try {
      await this.getCreateLinkPromise(id);
      this.toastMessageService.showSuccess(
        "The Binary Regression was linked successfully."
      );
      this.binaryRegressionLinkingStateService.reset();
    } catch (e) {
      this.toastMessageService.showError(
        `The Binary Regression was created but failed to link. Please try linking it again.`
      );
      this.binaryRegressionLinkingStateService.setIsLinking(true);
      this.binaryRegressionLinkingStateService.setIsCreating(false);
    }
  };

  private getCreateLinkPromise(id: string) {
    return lastValueFrom(this.createRegressionLink(id));
  }

  handleWarningMessage(warningMessage?: string) {
    this.warningMessage = warningMessage;
  }

  protected readonly DetectionCategory = DetectionCategory;
  protected readonly DetectionType = DetectionType;
}
