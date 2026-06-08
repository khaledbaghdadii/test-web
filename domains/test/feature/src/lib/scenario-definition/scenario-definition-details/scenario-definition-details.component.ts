import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { GlobalSelectors } from "@mxflow/core/global-store";
import {
  BusinessProcessChain,
  ScenarioDefinition,
} from "@mxevolve/domains/test/model";
import { ScenarioDefinitionTestsTableComponent } from "../scenario-definition-tests-table/scenario-definition-tests-table.component";
import { AuthorizationUtilsModule } from "@mxflow/core/auth";
import {
  EnvironmentDefinitionNameComponent,
  EnvironmentService,
} from "@mxflow/features/environment";
import {
  StreamsService,
  StreamsTagDisplayModule,
} from "@mxflow/features/streams";
import { ToastMessageService } from "@mxflow/ui/alert";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { MXEvolveShowMoreLessModule } from "@mxflow/ui/utils";
import { Store } from "@ngrx/store";
import { concatMap, forkJoin, map, of, Subject, takeUntil } from "rxjs";
import { ButtonModule } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";
import {
  ScenarioDefinitionMapper,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";

@Component({
  selector: "mxevolve-scenario-definition-details",
  templateUrl: "./scenario-definition-details.component.html",
  standalone: true,
  imports: [
    CardContainerModule,
    HeaderTitleModule,
    AuthorizationUtilsModule,
    ButtonModule,
    RouterLink,
    StreamsTagDisplayModule,
    MXEvolveShowMoreLessModule,
    EnvironmentDefinitionNameComponent,
    SkeletonModule,
    ScenarioDefinitionTestsTableComponent,
  ],
})
export class ScenarioDefinitionDetailsComponent implements OnInit, OnDestroy {
  private readonly streamsService = inject(StreamsService);
  private readonly environmentService = inject(EnvironmentService);
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly scenarioDefinitionApiService = inject(
    ScenarioDefinitionService
  );
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroy$ = new Subject();

  projectId: string;
  bpcNames?: string[];
  isLoading: boolean;

  scenarioDefinition: ScenarioDefinition;
  scenarioDefinitionId: string;
  scenarioDefinitionBpcIds: string[] = [];

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  ngOnInit() {
    this.isLoading = true;
    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(
        concatMap((projectId) => {
          this.projectId = projectId;
          return this.route.params;
        }),
        concatMap((routeParams) => {
          this.scenarioDefinitionId = routeParams["scenarioDefinitionId"];
          return this.scenarioDefinitionApiService.getScenarioDefinitionById(
            this.scenarioDefinitionId,
            this.projectId
          );
        }),
        concatMap((response) => {
          const testDefinitionIds = response.tests.map(
            (test) => test.testDefinitionId
          );
          return forkJoin([
            of(response),
            this.scenarioDefinitionApiService.getTestDefinitions(
              this.projectId,
              testDefinitionIds
            ),
            this.streamsService.getListOfBpcsByProjectId(this.projectId),
            this.environmentService.getEnvironmentDefinitionById(
              this.projectId,
              response.environmentDefinitionId
            ),
          ]);
        }),
        map(([response, testDefinitions, bpcs, environment]) =>
          ScenarioDefinitionMapper.toScenarioDefinition(
            response,
            testDefinitions,
            bpcs,
            [environment]
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.scenarioDefinition = data;
          this.scenarioDefinitionBpcIds = this.scenarioDefinition.bpcs.map(
            (bpc: BusinessProcessChain) => bpc.id
          );
          this.isLoading = false;
          this.bpcNames = data.bpcs.map((bpc) => bpc.name);
        },
        error: (error) => {
          this.isLoading = false;
          this.toastMessageService.showError(error);
        },
      });
  }
}
