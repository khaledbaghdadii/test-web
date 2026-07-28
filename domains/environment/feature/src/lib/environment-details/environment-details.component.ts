import { Component, computed, inject } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { ProgressSpinner } from "primeng/progressspinner";
import { MessageService } from "primeng/api";
import { Toast } from "primeng/toast";
import {
  EnvironmentService,
  ManagementRequestService,
} from "@mxevolve/domains/environment/data-access";

import {
  EnvironmentActionsPanelComponent,
  EnvironmentDetailsHeaderComponent,
  EnvironmentDetailsInfoComponent,
  EnvironmentResourcesTabsComponent,
} from "@mxevolve/domains/environment/widget";
import { ToastMessageService } from "@mxevolve/shared/ui/primitive";
import { BreadcrumbComponent } from "@mxevolve/domains/analytics/widget";

@Component({
  selector: "mxevolve-environment-details",
  standalone: true,
  imports: [
    Toast,
    ProgressSpinner,
    EnvironmentDetailsHeaderComponent,
    EnvironmentDetailsInfoComponent,
    EnvironmentActionsPanelComponent,
    EnvironmentResourcesTabsComponent,
    BreadcrumbComponent,
  ],
  providers: [MessageService, ToastMessageService],
  templateUrl: "./environment-details.component.html",
})
export class EnvironmentDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly environmentService = inject(EnvironmentService);
  private readonly managementRequestService = inject(ManagementRequestService);
  private readonly toast = inject(ToastMessageService);

  /**
   * Project id is read from the URL (via `pathFromRoot`) — not from any store — so the
   * environment-details screen keeps working when opened in a new tab. Mirrors the legacy
   * resolver behavior to preserve deep-linking with no regression.
   */
  readonly projectId =
    this.route.pathFromRoot
      .find((parent) => parent.snapshot.paramMap.has("projectId"))
      ?.snapshot.paramMap.get("projectId") ?? "";

  readonly environmentId =
    this.route.snapshot.paramMap.get("environment-id") ?? "";

  readonly environmentResource = rxResource({
    params: () => ({
      projectId: this.projectId,
      environmentId: this.environmentId,
    }),
    stream: ({ params }) =>
      this.environmentService.fetchByProjectAndEnvironmentId(
        params.projectId,
        params.environmentId
      ),
  });

  readonly requestsResource = rxResource({
    params: () => ({
      projectId: this.projectId,
      environmentId: this.environmentId,
    }),
    stream: ({ params }) =>
      this.managementRequestService.fetchByProjectAndEnvironmentId(
        params.projectId,
        params.environmentId
      ),
  });

  readonly loading = computed(
    () =>
      this.environmentResource.isLoading() || this.requestsResource.isLoading()
  );

  readonly hasError = computed(() => this.environmentResource.error() != null);

  readonly requests = computed(() => this.requestsResource.value() ?? []);

  readonly latestRequest = computed(() => this.requests()[0]);

  reloadAll(): void {
    this.environmentResource.reload();
    this.requestsResource.reload();
  }

  reloadRequests(): void {
    this.requestsResource.reload();
  }

  handlePanelError(error: Error): void {
    this.toast.showError(error.message);
  }
}
