import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Button } from "primeng/button";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { EMPTY, catchError, map, switchMap } from "rxjs";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { BusinessProcessScenarioDefinitionSelectorComponent } from "@mxflow/ui/inputs";
import { FeaturesArtifactManagerModule } from "@mxflow/features/artifact-manager";
import { CommitsService, TagService } from "@mxevolve/domains/scm/data-access";
import { DeployReferenceResourceService } from "@mxevolve/domains/business-process/data-access";
import { ScenarioRunService } from "@mxevolve/domains/test/data-access";
import {
  AnalyticsTrackerService,
  EventAction,
  EventCategory,
} from "@mxflow/core/analytics-tracker";

@Component({
  selector: "mxevolve-deploy-reference-resource-form",
  standalone: true,
  imports: [
    Button,
    Dialog,
    InputText,
    ReactiveFormsModule,
    BusinessProcessScenarioDefinitionSelectorComponent,
    FeaturesArtifactManagerModule,
  ],
  providers: [
    TagService,
    CommitsService,
    ScenarioRunService,
    DeployReferenceResourceService,
  ],
  templateUrl: "./deploy-reference-resource-form.component.html",
})
export class DeployReferenceResourceFormComponent {
  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();
  readonly scenarioExecutionGroupId = input.required<string>();
  readonly infraGroupId = input.required<string>();

  readonly initialFactoryProductId = input<string>();
  readonly initialCommitOrTag = input<string>();
  readonly businessProcessQualityLevel = input<string>();
  readonly initialScenarioDefinition = input<string>();

  readonly deployed = output<void>();

  readonly visible = model(false);

  private readonly analyticsTracker = inject(AnalyticsTrackerService);
  private readonly tagService = inject(TagService);
  private readonly commitsService = inject(CommitsService);
  private readonly deployService = inject(DeployReferenceResourceService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyRef = inject(DestroyRef);

  readonly factoryProductId = linkedSignal<string | undefined>(() =>
    this.initialFactoryProductId()
  );
  readonly loading = signal(false);

  readonly form = new FormGroup({
    commitOrTag: new FormControl<string>("", { nonNullable: true }),
    scenarioDefinition: new FormControl<string>("", { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const commitOrTag = this.initialCommitOrTag();
      if (commitOrTag) {
        this.form.controls.commitOrTag.setValue(commitOrTag);
      }
    });
  }

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly deployDisabled = computed(() => {
    const value = this.formValue();
    return (
      this.loading() ||
      !this.factoryProductId() ||
      !value.commitOrTag?.trim() ||
      !value.scenarioDefinition
    );
  });

  onFactoryProductIdChange(factoryProductId: string | undefined): void {
    this.factoryProductId.set(factoryProductId);
    this.analyticsTracker.trackEvent(
      EventCategory.DROP_DOWN,
      EventAction.SELECT_FROM_DORP_DOWN,
      `Reference environment factory product ID changed to: ${factoryProductId}`
    );
  }

  deploy(): void {
    const factoryProductId = this.factoryProductId();
    if (this.deployDisabled() || !factoryProductId) return;

    const commitOrTag = this.form.controls.commitOrTag.value.trim();
    this.loading.set(true);

    const request$ = this.tagService
      .getTag(this.projectId(), this.repositoryId(), commitOrTag)
      .pipe(
        map((tag) => tag.commitId),
        catchError(() => {
          return this.commitsService
            .getCommit({
              projectId: this.projectId(),
              repositoryId: this.repositoryId(),
              commitId: commitOrTag,
            })
            .pipe(
              map(() => commitOrTag),
              catchError(() => {
                this.loading.set(false);
                this.toastMessageService.showError(
                  "Reference environment deployment failed due to invalid commit or tag"
                );
                return EMPTY;
              })
            );
        }),
        switchMap((commitId) => this.launch(commitId, factoryProductId))
      );

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.loading.set(false);
        this.visible.set(false);
        this.toastMessageService.showSuccess(
          "Reference environment deployed successfully"
        );
        this.deployed.emit();
        this.analyticsTracker.trackEvent(
          EventCategory.BUTTON,
          EventAction.CLICK_BUTTON,
          `Reference Environment deployed with factory product ID: ${factoryProductId}`
        );
      },
      error: () => {
        this.loading.set(false);
        this.toastMessageService.showError(
          "Reference environment deployment failed"
        );
      },
    });
  }

  private launch(commitId: string, factoryProductId: string) {
    return this.deployService.deployReferenceResource(this.projectId(), {
      commitId: commitId,
      referenceFactoryProductId: factoryProductId,
      scenarioDefinitionId: this.form.controls.scenarioDefinition.value,
      executionGroupId: this.scenarioExecutionGroupId(),
      machineGroupId: this.infraGroupId(),
      qualityLevel: this.businessProcessQualityLevel()!,
      cleanIfPassed: false,
      disableKeepExecution: true,
      disableConfigurationEditor: false,
      supportReconActivities: true,
      stopServices: true,
      validationScopeEnabled: true,
      incidentEnabled: true,
    });
  }
}
