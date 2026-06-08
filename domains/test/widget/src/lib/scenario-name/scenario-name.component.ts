import { Component, inject, input } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { Skeleton } from "primeng/skeleton";
import {
  ScenarioDefinitionService,
  TestDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { ToastMessageService } from "@mxflow/ui/alert";
import { catchError, map, of } from "rxjs";

@Component({
  selector: "mxevolve-scenario-name",
  standalone: true,
  imports: [Skeleton],
  providers: [ScenarioDefinitionService, TestDefinitionService],
  template: `
    @if (nameResource.isLoading()) {
    <p-skeleton width="6rem" height="1rem" />
    } @else {
    <span>{{ nameResource.value() }}</span>
    }
  `,
})
export class ScenarioNameComponent {
  readonly projectId = input.required<string>();
  readonly scenarioDefinitionId = input.required<string>();

  private readonly scenarioDefinitionService = inject(
    ScenarioDefinitionService
  );
  private readonly toastMessageService = inject(ToastMessageService);

  readonly nameResource = rxResource({
    params: () => ({
      scenarioDefinitionId: this.scenarioDefinitionId(),
      projectId: this.projectId(),
    }),
    stream: ({ params }) =>
      this.scenarioDefinitionService
        .getScenarioDefinitionById(
          params.scenarioDefinitionId,
          params.projectId
        )
        .pipe(
          map((scenario) => scenario.name),
          catchError(() => {
            this.toastMessageService.showError("Failed to load scenario name");
            return of("-");
          })
        ),
  });
}
