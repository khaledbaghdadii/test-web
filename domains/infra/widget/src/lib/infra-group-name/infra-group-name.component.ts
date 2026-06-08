import { Component, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { Skeleton } from "primeng/skeleton";
import { InfraGroupService } from "@mxevolve/domains/infra/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { catchError, map, of } from "rxjs";

@Component({
  selector: "mxevolve-infra-group-name",
  standalone: true,
  imports: [Skeleton],
  providers: [InfraGroupService],
  template: `
    @if (nameResource.isLoading()) {
    <p-skeleton width="6rem" height="1rem" />
    } @else {
    <span>{{ nameResource.value() }}</span>
    }
  `,
})
export class InfraGroupNameComponent {
  readonly projectId = input.required<string>();
  readonly infraGroupId = input.required<string>();

  private readonly infraGroupService = inject(InfraGroupService);
  private readonly toastMessageService = inject(ToastMessageService);

  readonly nameResource = rxResource({
    params: () => ({
      projectId: this.projectId(),
      infraGroupId: this.infraGroupId(),
    }),
    stream: ({ params }) =>
      this.infraGroupService
        .getGroup(params.projectId, params.infraGroupId)
        .pipe(
          map((group) => group.name),
          catchError(() => {
            this.toastMessageService.showError(
              "Failed to load infra group name"
            );
            return of("-");
          })
        ),
  });
}
