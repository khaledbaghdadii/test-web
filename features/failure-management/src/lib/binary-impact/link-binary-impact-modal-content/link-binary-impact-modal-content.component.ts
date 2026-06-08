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
import {
  ShowDetectionWithNoDefectsToggleComponent,
  ValidationScope,
  ValidationScopeSetterComponent,
} from "@mxflow/features/validation-management";
import {
  BehaviorSubject,
  filter,
  lastValueFrom,
  Observable,
  Subject,
  takeUntil,
} from "rxjs";
import { ButtonModule } from "primeng/button";
import { BinaryImpactsSelectionTableComponent } from "../binary-impacts-selection-table/binary-impacts-selection-table.component";
import { CreateBinaryImpactResponse } from "../create-binary-impact-response.model";
import { ToastMessageService } from "@mxflow/ui/alert";
import { toObservable } from "@angular/core/rxjs-interop";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  BinaryImpactLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { LiteBinaryImpact } from "../lite-binary-impact.model";
import { CreateBinaryImpactButtonComponent } from "../create-binary-impact-button/create-binary-impact-button.component";
import { Message } from "primeng/message";
import { FormsModule } from "@angular/forms";
import { DetectionCategory, DetectionType } from "../../detections";

@Component({
  selector: "mxevolve-link-binary-impact-modal-content",
  imports: [
    ButtonModule,
    BinaryImpactsSelectionTableComponent,
    CreateBinaryImpactButtonComponent,
    Message,
    FormsModule,
    ValidationScopeSetterComponent,
    ShowDetectionWithNoDefectsToggleComponent,
  ],
  templateUrl: "./link-binary-impact-modal-content.component.html",
})
export class LinkBinaryImpactModalContentComponent implements OnDestroy {
  private readonly toastMessageService = inject(ToastMessageService);

  private readonly destroy$ = new Subject<void>();
  private readonly binaryImpactLinkingStateService = inject(
    BinaryImpactLinkingStateService
  );

  isCreating = this.binaryImpactLinkingStateService.isCreating;
  isLinking = this.binaryImpactLinkingStateService.isLinking;
  refresh$ = new BehaviorSubject<boolean>(false);
  showImpactsWithoutDefects = signal(false);

  @Input()
  initiallySelectedImpacts: AnalysisObjectSelectionState<AnalysisObject>[] = [];
  @Input({ required: true }) selectedImpactIdsLoading: boolean;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) scenarioExecutionId: string;
  @Input({ required: true }) mxVersionInitialValue: string;
  @Input({ required: true }) createImpactLink: (
    impactId: string
  ) => Observable<null>;
  @Input() isSubmitButtonLoading = false;
  validationScope = model<ValidationScope | undefined>(undefined);
  initialValidationScope = input<ValidationScope | undefined>(undefined);
  @Input() warningMessage?: string;

  @Output() selectedBinaryImpactsChange = new EventEmitter<
    AnalysisObjectSelectionState<LiteBinaryImpact>[]
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

  onBinaryImpactSelectionChange(
    selectedImpacts: AnalysisObjectSelectionState<LiteBinaryImpact>[]
  ) {
    this.selectedBinaryImpactsChange.emit(selectedImpacts);
  }

  showCreateBinaryImpactModal() {
    this.binaryImpactLinkingStateService.setIsCreating(true);
    this.binaryImpactLinkingStateService.setIsLinking(false);
  }

  onCreateBinaryImpactCancelled() {
    if (this.isCreating() || this.isLinking()) {
      this.binaryImpactLinkingStateService.setIsCreating(false);
      this.binaryImpactLinkingStateService.setIsLinking(true);
    }
  }

  async onBinaryImpactCreated(response: CreateBinaryImpactResponse) {
    await this.createLink(response.id);
  }

  private createLink = async (id: string) => {
    try {
      await this.getCreateLinkPromise(id);
      this.toastMessageService.showSuccess(
        "The Binary Impact was linked successfully."
      );
      this.binaryImpactLinkingStateService.reset();
    } catch (e) {
      this.toastMessageService.showError(
        `The Binary Impact was created but failed to link. Please try linking it again.`
      );
      this.binaryImpactLinkingStateService.setIsLinking(true);
      this.binaryImpactLinkingStateService.setIsCreating(false);
    }
  };

  private getCreateLinkPromise(id: string) {
    return lastValueFrom(this.createImpactLink(id));
  }

  handleWarningMessage(warningMessage?: string) {
    this.warningMessage = warningMessage;
  }

  protected readonly DetectionCategory = DetectionCategory;
  protected readonly DetectionType = DetectionType;
}
