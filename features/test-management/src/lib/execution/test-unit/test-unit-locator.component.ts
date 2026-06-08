import { Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TestUnitService } from "./test-unit.service";
import { ScenarioExecutionUriFactoryPipe } from "../scenario-execution/scenario-execution-uri-factory-pipe/scenario-execution-uri-factory.pipe";
import { ProjectUrlPipe } from "@mxflow/features/project";
import { MxflowSpinnerModule } from "@mxflow/ui/utils";

@Component({
  providers: [TestUnitService, ScenarioExecutionUriFactoryPipe, ProjectUrlPipe],
  selector: "mxevolve-test-unit-locator",
  imports: [MxflowSpinnerModule],
  template: `<div class="mt-2">
    <mxflow-spinner [isLoading]="true"></mxflow-spinner>
  </div>`,
})
export class TestUnitLocatorComponent implements OnInit {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly scenarioExecutionUriFactoryPipe = inject(
    ScenarioExecutionUriFactoryPipe
  );
  private readonly testUnitService = inject(TestUnitService);

  ngOnInit() {
    this.activatedRoute.params.subscribe({
      next: (routeParams) => {
        this.navigateToHeadScenarioExecution(
          routeParams["projectId"],
          routeParams["testUnitId"]
        );
      },
    });
  }

  private navigateToHeadScenarioExecution(
    projectId: string,
    testUnitId: string
  ) {
    this.testUnitService
      .fetchById(projectId, testUnitId)
      .subscribe((testUnit) => {
        const headScenarioExecutionId = testUnit.headScenarioExecution.id;
        const headScenarioExecutionUri =
          this.scenarioExecutionUriFactoryPipe.transform(
            headScenarioExecutionId,
            projectId
          );
        this.router.navigateByUrl(headScenarioExecutionUri);
      });
  }
}
