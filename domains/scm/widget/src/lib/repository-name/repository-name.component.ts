import { Component, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { Skeleton } from "primeng/skeleton";
import { RepositoryService } from "@mxevolve/domains/scm/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { catchError, map, of } from "rxjs";

@Component({
  selector: "mxevolve-repository-name",
  standalone: true,
  imports: [Skeleton],
  providers: [RepositoryService],
  template: `
    @if (nameResource.isLoading()) {
    <p-skeleton width="6rem" height="1rem" />
    } @else {
    <span>{{ nameResource.value() }}</span>
    }
  `,
})
export class RepositoryNameComponent {
  readonly projectId = input.required<string>();
  readonly repositoryId = input.required<string>();

  private readonly repositoryService = inject(RepositoryService);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly nameResource = rxResource({
    params: () => ({
      projectId: this.projectId(),
      repositoryId: this.repositoryId(),
    }),
    stream: ({ params }) =>
      this.repositoryService
        .getRepository(params.projectId, params.repositoryId)
        .pipe(
          map((repository) => repository.name),
          catchError(() => {
            this.toastMessageService.showError(
              "Failed to load repository name"
            );
            return of("-");
          })
        ),
  });
}
