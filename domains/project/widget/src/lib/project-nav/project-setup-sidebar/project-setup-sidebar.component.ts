import { Component, inject } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { from, of, switchMap } from "rxjs";
import { AuthorizationService } from "@mxflow/core/auth";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ProjectNavSidebarComponent } from "../project-nav-sidebar/project-nav-sidebar.component";
import { filterMenuItemsByAuthorization } from "../menu-item-auth-filter.util";
import { POOLS_FEATURE_FLAG_NAME, setupNavItems } from "./setup-nav-items";

/**
 * Sidebar for the Project Setup section. Rendered by the shell's
 * `AppLayoutComponent` so authorization and feature-flag resolution run where
 * `FEATURE_FLAG_CONFIG` is always available.
 */
@Component({
  selector: "mxevolve-project-setup-sidebar",
  standalone: true,
  imports: [ProjectNavSidebarComponent],
  template: `<mxevolve-project-nav-sidebar [items]="items()" />`,
})
export class ProjectSetupSidebarComponent {
  private readonly authorizationService = inject(AuthorizationService);
  private readonly featureFlagResolver = inject(FeatureFlagResolver);
  private readonly projectId = inject(ProjectIdRouteParamsResolverService)
    .projectId;

  readonly items = toSignal(
    toObservable(this.projectId).pipe(
      switchMap((projectId) => {
        if (!projectId) {
          return of([]);
        }
        return from(
          this.featureFlagResolver.isFeatureEnabled(
            projectId,
            POOLS_FEATURE_FLAG_NAME
          )
        ).pipe(
          switchMap((poolsEnabled) =>
            filterMenuItemsByAuthorization(
              setupNavItems(projectId, poolsEnabled),
              this.authorizationService
            )
          )
        );
      })
    ),
    { initialValue: [] }
  );
}
