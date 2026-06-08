import { Component, inject, Input, OnDestroy, OnInit } from "@angular/core";
import { Store } from "@ngrx/store";
import {
  dropEnvironmentDetails,
  Environment,
  EnvironmentsState,
  retrieveEnvironment,
  selectEnvironment,
} from "@mxflow/features/environment";
import { skipWhile, Subject, takeUntil } from "rxjs";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ToastMessageService } from "@mxflow/ui/alert";

@Component({
  selector: "mxflow-build-environment-details",
  templateUrl: "build-environment-details.component.html",
  standalone: false,
})
export class BuildEnvironmentDetailsComponent implements OnInit, OnDestroy {
  private readonly environmentStore = inject(Store<EnvironmentsState>);
  private readonly featureFlagResolver = inject(FeatureFlagResolver);
  private readonly toastMessageService = inject(ToastMessageService);

  @Input() projectId: string;
  @Input() environmentId: string;

  readonly WORKSPACE_CONFIGURATION_EDITOR_UI_FEATURE_FLAG =
    "workspace-configuration-editor-ui";
  isConfigurationEditorEnabled = false;

  private readonly destroy$ = new Subject();

  environment: Environment;
  disableCompanion: boolean;

  ngOnInit(): void {
    this.environmentStore.dispatch(
      retrieveEnvironment({
        projectId: this.projectId,
        id: this.environmentId,
      })
    );

    this.environmentStore
      .select(
        selectEnvironment({
          projectId: this.projectId,
          environmentId: this.environmentId,
        })
      )
      .pipe(
        skipWhile((env) => env === undefined),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (environment) => {
          this.environment = environment as Environment;
          this.disableCompanion = !this.environment.status.includes("READY");
        },
        error: (errorMessage) => {
          this.toastMessageService.showError(errorMessage);
        },
      });

    this.featureFlagResolver
      .isFeatureEnabled(
        this.projectId,
        this.WORKSPACE_CONFIGURATION_EDITOR_UI_FEATURE_FLAG
      )
      .then((enabled: boolean) => {
        this.isConfigurationEditorEnabled = enabled;
      })
      .catch(() => {
        this.isConfigurationEditorEnabled = false;
      });
  }

  ngOnChanges = (): void => {
    if (this.environment) {
      this.disableCompanion = !this.environment.status.includes("READY");
    }
  };

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
    if (this.environmentId) {
      this.environmentStore.dispatch(
        dropEnvironmentDetails({ id: this.environmentId })
      );
    }
  }
}
