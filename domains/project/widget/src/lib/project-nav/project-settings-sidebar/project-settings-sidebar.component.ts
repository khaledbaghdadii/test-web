import { Component, inject } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { from, of, switchMap } from "rxjs";
import { AuthorizationService } from "@mxflow/core/auth";
import { FeatureFlagResolver } from "@mxflow/feature-flags";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ProjectNavSidebarComponent } from "../project-nav-sidebar/project-nav-sidebar.component";
import { filterMenuItemsByAuthorization } from "../menu-item-auth-filter.util";
import {
  CONFIG_AUDIT_FEATURE_FLAG_NAME,
  settingsNavItems,
} from "./settings-nav-items";

/**
 * Sidebar for the Settings section. Rendered by the shell's
 * `AppLayoutComponent` so authorization and feature-flag resolution run where
 * `FEATURE_FLAG_CONFIG` is always available.
 */
@Component({
  selector: "mxevolve-project-settings-sidebar",
  standalone: true,
  imports: [ProjectNavSidebarComponent],
  template: `<mxevolve-project-nav-sidebar [items]="items()" />`,
})
export class ProjectSettingsSidebarComponent {
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
            CONFIG_AUDIT_FEATURE_FLAG_NAME
          )
        ).pipe(
          switchMap((configAuditEnabled) =>
            filterMenuItemsByAuthorization(
              settingsNavItems(projectId, configAuditEnabled),
              this.authorizationService
            )
          )
        );
      })
    ),
    { initialValue: [] }
  );
}
