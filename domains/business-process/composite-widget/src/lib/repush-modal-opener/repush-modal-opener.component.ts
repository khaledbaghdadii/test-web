import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  model,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Button } from "primeng/button";
import { Tooltip } from "primeng/tooltip";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import {
  BusinessProcessExecutionEligibilityService,
  IneligibilityResult,
} from "@mxevolve/domains/business-process/data-access";
import { ExecutionFamily } from "@mxevolve/domains/business-process/util";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";
import { BusinessProcessLimitExceedModalComponent } from "./business-process-limit-exceed-modal.component";

const ON_DEMAND_BACKPORT = "on-demand-backport";

/**
 * Event emitted when the eligibility gate passes and the execution may be
 * repushed. The consuming feature opens the family-specific repush modal.
 *
 * NOTE: the three family repush input-form modals
 * (upgrade / validation / build-and-test) are migrated together with the
 * per-family executor forms (see VAL-27132 executor batches). Until then this
 * opener performs the eligibility gate and surfaces the eligible decision via
 * this output rather than opening the family modal directly.
 */
export interface RepushEligibleEvent {
  projectId: string;
  processId: string;
  familyId: ExecutionFamily;
}

@Component({
  selector: "mxevolve-business-process-execution-repush-modal-opener",
  imports: [
    Button,
    Tooltip,
    MxevolveIconComponent,
    BusinessProcessLimitExceedModalComponent,
  ],
  providers: [BusinessProcessExecutionEligibilityService],
  templateUrl: "./repush-modal-opener.component.html",
})
export class RepushModalOpenerComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly familyId = input.required<ExecutionFamily>();
  readonly familyName = input<string>();
  readonly sourceDefinitionId = input<string | null | undefined>();
  readonly disabled = model(false);

  readonly eligibleToRepush = output<RepushEligibleEvent>();

  private readonly eligibilityService = inject(
    BusinessProcessExecutionEligibilityService
  );
  private readonly toastService = inject(ToastMessageService);
  private readonly analyticsTracker = inject(AnalyticsTrackerService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly isLoading = signal(false);
  readonly loading = computed(() => this.isLoading());

  protected readonly limitModalVisible = signal(false);
  protected readonly ineligibilityResult = signal<
    IneligibilityResult | undefined
  >(undefined);

  readonly buttonDisabled = computed(() => {
    const source = this.sourceDefinitionId();
    return this.disabled() || source === ON_DEMAND_BACKPORT || source == null;
  });

  openRepushModal(): void {
    const source = this.sourceDefinitionId();
    if (source == null) {
      return;
    }

    this.analyticsTracker.trackEvent(
      EventCategory.BUTTON,
      EventAction.CLICK_BUTTON,
      `Open Repush Modal - ${this.familyId()}`
    );

    this.isLoading.set(true);
    this.disabled.set(true);

    this.eligibilityService
      .getBusinessProcessExecutionEligibility(
        this.projectId(),
        this.familyId(),
        source
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.eligible) {
            this.disabled.set(false);
            this.eligibleToRepush.emit({
              projectId: this.projectId(),
              processId: this.processId(),
              familyId: this.familyId(),
            });
          } else {
            this.ineligibilityResult.set(response.ineligibilityResult);
            this.limitModalVisible.set(true);
            this.disabled.set(false);
          }
        },
        error: (error: Error) => {
          this.isLoading.set(false);
          this.disabled.set(false);
          this.toastService.showError(error.message);
        },
      });
  }
}
