import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { rxResource, takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { of } from "rxjs";
import { ConfirmationService, MessageService } from "primeng/api";
import { Button } from "primeng/button";
import { ConfirmDialog } from "primeng/confirmdialog";
import { Message } from "primeng/message";
import { Tooltip } from "primeng/tooltip";
import {
  MxevolveIconComponent,
  ToastMessageService,
} from "@mxevolve/shared/ui/primitive";
import { EnvironmentsTableComponent } from "@mxevolve/domains/environment/widget";
import {
  UserRequestService,
  UserRequestStatus,
} from "@mxevolve/domains/environment/data-access";
import {
  ReferenceEnvironmentService,
  UpgradeProcessStateUpdaterService,
} from "@mxevolve/domains/business-process/data-access";

@Component({
  selector: "mxevolve-upgrade-process-reference-environments",
  imports: [
    Button,
    ConfirmDialog,
    Message,
    Tooltip,
    EnvironmentsTableComponent,
    MxevolveIconComponent,
  ],
  providers: [
    UserRequestService,
    ReferenceEnvironmentService,
    ConfirmationService,
    MessageService,
    UpgradeProcessStateUpdaterService,
  ],
  templateUrl: "./reference-environments.component.html",
})
export class ReferenceEnvironmentsComponent {
  readonly projectId = input.required<string>();
  readonly processId = input.required<string>();
  readonly enabledInCurrentlyActiveStage = input.required<boolean>();
  readonly limitReached = input.required<boolean>();
  readonly canCleanAndDeploy = input.required<boolean>();
  readonly environmentIds = input.required<string[]>();
  readonly requestIds = input.required<string[]>();

  private readonly deploymentRequestService = inject(UserRequestService);
  private readonly upgradeProcessExecutionService = inject(
    ReferenceEnvironmentService
  );
  private readonly upgradeProcessStateUpdaterService = inject(
    UpgradeProcessStateUpdaterService
  );
  private readonly confirmationService = inject(ConfirmationService);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroyReference = inject(DestroyRef);

  readonly deploymentStatus = rxResource<
    UserRequestStatus,
    {
      projectId: string;
      requestIds: string[];
      environmentIds: string[];
    }
  >({
    params: () => ({
      projectId: this.projectId(),
      requestIds: this.requestIds(),
      environmentIds: this.environmentIds(),
    }),
    stream: ({ params }) => {
      if (params.requestIds.length === 0) {
        return of<UserRequestStatus>({
          environmentIds: params.environmentIds,
          latestRequestInProgress: false,
          latestRequestFailed: false,
        });
      }
      return this.deploymentRequestService.fetchUserRequestStatus(
        params.projectId,
        params.requestIds
      );
    },
    defaultValue: {
      environmentIds: [],
      latestRequestInProgress: false,
      latestRequestFailed: false,
    },
  });

  readonly deploymentRequestLoading = signal(false);

  readonly deploymentDisabled = computed(
    () =>
      this.deploymentStatus.isLoading() ||
      !(
        this.enabledInCurrentlyActiveStage() &&
        (!this.limitReached() || this.canCleanAndDeploy())
      )
  );

  readonly tooltipMessage = computed(() => {
    if (!this.enabledInCurrentlyActiveStage()) {
      return "Reference environment deployment is not allowed in the current stage of the process.";
    }
    if (!this.canCleanAndDeploy()) {
      return "You cannot deploy a new reference environment while a previous one is still deploying.";
    }
    return "";
  });

  constructor() {
    effect(() => {
      if (this.deploymentStatus.status() === "error") {
        this.toastMessageService.showError(
          "Failed to fetch the reference environments."
        );
      }
    });
  }

  onDeployClick(): void {
    if (this.limitReached()) {
      this.confirmCleanAndDeploy();
    } else {
      this.deploy();
    }
  }

  private deploy(): void {
    this.deploymentRequestLoading.set(true);
    this.upgradeProcessExecutionService
      .deployReferenceEnvironment(this.projectId(), this.processId())
      .pipe(takeUntilDestroyed(this.destroyReference))
      .subscribe({
        next: () => {
          this.deploymentRequestLoading.set(false);
          this.toastMessageService.showSuccess(
            "Reference environment deployment requested successfully."
          );
          this.upgradeProcessStateUpdaterService.reloadProcessDetails(
            this.processId(),
            this.projectId()
          );
        },
        error: (error) => {
          this.deploymentRequestLoading.set(false);
          this.toastMessageService.showError(error.message);
        },
      });
  }

  private cleanAndDeploy(environmentIdToClean: string): void {
    this.deploymentRequestLoading.set(true);
    this.upgradeProcessExecutionService
      .cleanAndDeployReferenceEnvironment(
        this.projectId(),
        this.processId(),
        environmentIdToClean
      )
      .pipe(takeUntilDestroyed(this.destroyReference))
      .subscribe({
        next: () => {
          this.deploymentRequestLoading.set(false);
          this.toastMessageService.showSuccess(
            "Reference environment deployment requested successfully."
          );
          this.upgradeProcessStateUpdaterService.reloadProcessDetails(
            this.processId(),
            this.projectId()
          );
        },
        error: (error) => {
          this.deploymentRequestLoading.set(false);
          this.toastMessageService.showError(error.message);
        },
      });
  }

  private confirmCleanAndDeploy(): void {
    this.confirmationService.confirm({
      header: "Clean and Deploy",
      acceptLabel: "Clean and Deploy",
      rejectLabel: "Cancel",
      rejectButtonProps: { outlined: true },
      message:
        "You have deployed the maximum number of reference environments. To deploy a new one, the latest reference environment will be cleaned. Do you want to proceed?",
      accept: () => {
        const environmentIds = this.deploymentStatus.value().environmentIds;
        const lastEnvironmentId = environmentIds[environmentIds.length - 1];
        if (lastEnvironmentId) {
          this.cleanAndDeploy(lastEnvironmentId);
        }
      },
    });
  }
}
