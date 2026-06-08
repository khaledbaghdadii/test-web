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
import {
  AnalysisObject,
  AnalysisObjectSelectionState,
  ConfigurationImpactLinkingStateService,
} from "@mxflow/features/analysis-objects";
import { LiteConfigurationImpact } from "../model/lite-configuration-impact.model";
import { ToastMessageService } from "@mxflow/ui/alert";
import { toObservable } from "@angular/core/rxjs-interop";
import { CreateConfigurationImpactResponse } from "../create-configuration-impact-modal/create-configuration-impact-response";
import { ButtonModule } from "primeng/button";
import { ConfigurationImpactsSelectionTableComponent } from "../configuration-impacts-selection-table/configuration-impacts-selection-table.component";
import { CreateConfigurationImpactButtonComponent } from "../create-configuration-impact-button/create-configuration-impact-button.component";

@Component({
  selector: "mxevolve-link-configuration-impact-modal-content",
  imports: [
    ButtonModule,
    ConfigurationImpactsSelectionTableComponent,
    CreateConfigurationImpactButtonComponent,
  ],
  templateUrl: "./link-configuration-impact-modal-content.component.html",
})
export class LinkConfigurationImpactModalContentComponent implements OnDestroy {
  private toastMessageService = inject(ToastMessageService);

  private destroy$ = new Subject<void>();
  private configurationImpactLinkingStateService = inject(
    ConfigurationImpactLinkingStateService
  );

  isCreating = this.configurationImpactLinkingStateService.isCreating;
  isLinking = this.configurationImpactLinkingStateService.isLinking;
  refresh$ = new BehaviorSubject<boolean>(false);

  @Input()
  initiallySelectedConfigurationImpacts: AnalysisObjectSelectionState<AnalysisObject>[] =
    [];
  @Input({ required: true }) selectedImpactIdsLoading: boolean;
  @Input({ required: true }) projectId: string;
  @Input({ required: true }) createImpactLink: (
    ImpactId: string
  ) => Observable<null>;
  @Input() isSubmitButtonLoading = false;

  @Output() selectedConfigurationImpactsChange = new EventEmitter<
    AnalysisObjectSelectionState<LiteConfigurationImpact>[]
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

  onConfigurationImpactSelectionChange(
    selectedImpacts: AnalysisObjectSelectionState<LiteConfigurationImpact>[]
  ) {
    this.selectedConfigurationImpactsChange.emit(selectedImpacts);
  }

  showCreateConfigurationImpactModal() {
    this.configurationImpactLinkingStateService.setIsCreating(true);
    this.configurationImpactLinkingStateService.setIsLinking(false);
  }

  onCreateConfigurationImpactCancelled() {
    if (this.isCreating() || this.isLinking()) {
      this.configurationImpactLinkingStateService.setIsCreating(false);
      this.configurationImpactLinkingStateService.setIsLinking(true);
    }
  }

  async onConfigurationImpactCreated(
    response: CreateConfigurationImpactResponse
  ) {
    await this.createLink(response.id);
  }

  private createLink = async (id: string) => {
    try {
      await this.getCreateLinkPromise(id);
      this.toastMessageService.showSuccess(
        "The Configuration Impact was linked successfully."
      );
      this.configurationImpactLinkingStateService.reset();
    } catch (e) {
      this.toastMessageService.showError(
        "The Configuration Impact was created but failed to link. Please try linking it again."
      );
      this.configurationImpactLinkingStateService.setIsCreating(false);
      this.configurationImpactLinkingStateService.setIsLinking(true);
    }
  };

  private getCreateLinkPromise(id: string) {
    return lastValueFrom(this.createImpactLink(id));
  }
}
