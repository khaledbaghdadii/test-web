import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
} from "@angular/core";
import {
  BehaviorSubject,
  filter,
  lastValueFrom,
  Observable,
  Subject,
  takeUntil,
} from "rxjs";
import { ButtonModule } from "primeng/button";
import { ToastMessageService } from "@mxflow/ui/alert";
import { toObservable } from "@angular/core/rxjs-interop";
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  ConfigurationRegressionLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { ConfigurationRegressionsSelectionTableComponent } from "../configuration-regressions-selection-table/configuration-regressions-selection-table.component";
import { CreateConfigurationRegressionResponse } from "../model/create-configuration-regression-response.model";
import { LiteConfigurationRegression } from "../model/lite-configuration-regression.model";
import { CreateConfigurationRegressionButtonComponent } from "../create-configuration-regression-button/create-configuration-regression-button.component";

@Component({
  selector: "mxevolve-link-configuration-regression-modal-content",
  imports: [
    ButtonModule,
    ConfigurationRegressionsSelectionTableComponent,
    CreateConfigurationRegressionButtonComponent,
  ],
  templateUrl: "./link-configuration-regression-modal-content.component.html",
})
export class LinkConfigurationRegressionModalContentComponent
  implements OnDestroy
{
  private toastMessageService = inject(ToastMessageService);

  private destroy$ = new Subject<void>();
  private configurationRegressionLinkingStateService = inject(
    ConfigurationRegressionLinkingStateService
  );

  isCreating = this.configurationRegressionLinkingStateService.isCreating;
  isLinking = this.configurationRegressionLinkingStateService.isLinking;
  refresh$ = new BehaviorSubject<boolean>(false);

  @Input()
  initiallySelectedRegressions: AnalysisObjectSelectionState<AnalysisObject>[] =
    [];
  @Input({ required: true }) selectedRegressionIdsLoading: boolean;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) scenarioExecutionId: string;
  @Input({ required: true }) createRegressionLink: (
    regressionId: string
  ) => Observable<null>;
  @Input() isSubmitButtonLoading = false;

  @Output() selectedConfigurationRegressionsChange = new EventEmitter<
    AnalysisObjectSelectionState<LiteConfigurationRegression>[]
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

  onConfigurationRegressionSelectionChange(
    selectedRegressions: AnalysisObjectSelectionState<LiteConfigurationRegression>[]
  ) {
    this.selectedConfigurationRegressionsChange.emit(selectedRegressions);
  }

  showCreateConfigurationRegressionModal() {
    this.configurationRegressionLinkingStateService.setIsCreating(true);
    this.configurationRegressionLinkingStateService.setIsLinking(false);
  }

  onCreateConfigurationRegressionCancelled() {
    if (this.isCreating() || this.isLinking()) {
      this.configurationRegressionLinkingStateService.setIsCreating(false);
      this.configurationRegressionLinkingStateService.setIsLinking(true);
    }
  }

  async onConfigurationRegressionCreated(
    response: CreateConfigurationRegressionResponse
  ) {
    await this.createLink(response.id);
  }

  private createLink = async (id: string) => {
    try {
      await this.getCreateLinkPromise(id);
      this.toastMessageService.showSuccess(
        "The Configuration Regression was linked successfully."
      );
      this.configurationRegressionLinkingStateService.reset();
    } catch (e) {
      this.toastMessageService.showError(
        `The Configuration Regression was created but failed to link. Please try linking it again.`
      );
      this.configurationRegressionLinkingStateService.setIsCreating(false);
      this.configurationRegressionLinkingStateService.setIsLinking(true);
    }
  };

  private getCreateLinkPromise(id: string) {
    return lastValueFrom(this.createRegressionLink(id));
  }
}
