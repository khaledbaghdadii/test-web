import { Component, inject } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { of, switchMap } from "rxjs";
import { AuthorizationService } from "@mxflow/core/auth";
import { ProjectIdRouteParamsResolverService } from "@mxflow/features/project";
import { ProjectNavSidebarComponent } from "../project-nav-sidebar/project-nav-sidebar.component";
import { filterMenuItemsByAuthorization } from "../menu-item-auth-filter.util";
import { assetsNavItems } from "./assets-nav-items";

/**
 * Sidebar for the Project Assets section. Rendered by the shell's
 * `AppLayoutComponent` so authorization filtering runs where `FEATURE_FLAG_CONFIG`
 * and the project route params are always available.
 */
@Component({
  selector: "mxevolve-project-assets-sidebar",
  standalone: true,
  imports: [ProjectNavSidebarComponent],
  template: `<mxevolve-project-nav-sidebar [items]="items()" />`,
})
export class ProjectAssetsSidebarComponent {
  private readonly authorizationService = inject(AuthorizationService);
  private readonly projectId = inject(ProjectIdRouteParamsResolverService)
    .projectId;

  readonly items = toSignal(
    toObservable(this.projectId).pipe(
      switchMap((projectId) => {
        if (!projectId) {
          return of([]);
        }
        return filterMenuItemsByAuthorization(
          assetsNavItems(projectId),
          this.authorizationService
        );
      })
    ),
    { initialValue: [] }
  );
}
