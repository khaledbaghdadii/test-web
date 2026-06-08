import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { GlobalSelectors } from "@mxflow/core/global-store";
import {
  ScenarioDefinition,
  ScenarioDefinitionActivityStatus,
} from "@mxevolve/domains/test/model";
import { AuthorizationUtilsModule } from "@mxflow/core/auth";
import {
  EnvironmentDefinitionNameComponent,
  EnvironmentService,
} from "@mxflow/features/environment";
import { StreamsService } from "@mxflow/features/streams";
import { ToastMessageService } from "@mxflow/ui/alert";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { MXEvolveShowMoreLessModule } from "@mxflow/ui/utils";
import { Store } from "@ngrx/store";
import { forkJoin, map, Subject, takeUntil } from "rxjs";
import { formatTests } from "../scenario-tests-display";
import {
  ScenarioDefinitionMapper,
  ScenarioDefinitionService,
} from "@mxevolve/domains/test/data-access";
import { ButtonModule } from "primeng/button";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { RippleModule } from "primeng/ripple";
import { SelectButtonModule } from "primeng/selectbutton";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TooltipModule } from "primeng/tooltip";
import { ScenarioFilterPipe } from "./pipe/scenario-filter.pipe";
import { ArchiveScenarioDefinitionButtonComponent } from "@mxevolve/domains/test/widget";

interface TestToDisplay {
  [id: string]: string[];
}

@Component({
  selector: "mxevolve-scenario-definition-table",
  templateUrl: "./scenario-definition-table.component.html",
  standalone: true,
  imports: [
    FormsModule,
    CardContainerModule,
    HeaderTitleModule,
    IconField,
    InputIcon,
    InputTextModule,
    AuthorizationUtilsModule,
    ButtonModule,
    RouterLink,
    TableModule,
    SkeletonModule,
    ScenarioFilterPipe,
    MXEvolveShowMoreLessModule,
    EnvironmentDefinitionNameComponent,
    RippleModule,
    SelectButtonModule,
    TooltipModule,
    ArchiveScenarioDefinitionButtonComponent,
  ],
})
export class ScenarioDefinitionTableComponent implements OnInit, OnDestroy {
  private readonly streamsService = inject(StreamsService);
  private readonly environmentService = inject(EnvironmentService);
  private readonly scenarioDefinitionApiService = inject(
    ScenarioDefinitionService
  );
  private readonly store = inject(Store);
  private readonly toastMessageService = inject(ToastMessageService);
  private readonly destroy$ = new Subject();
  protected readonly Array = Array;

  searchInput = "";
  isLoading = false;
  projectId: string;
  scenarioDefinitions: ScenarioDefinition[] = [];
  testsToDisplay: TestToDisplay = {};

  viewActivityStatusOptions = [
    {
      label: "Unarchived",
      value: ScenarioDefinitionActivityStatus.ACTIVE,
    },
    {
      label: "Archived",
      value: ScenarioDefinitionActivityStatus.INACTIVE,
    },
  ];
  selectedActivityStatus: ScenarioDefinitionActivityStatus =
    ScenarioDefinitionActivityStatus.ACTIVE;

  listOfColumn = [
    {
      header: "Name",
      field: "name",
      width: "20%",
    },
    {
      header: "Scenario Quality Level",
      field: "qualityLevel",
      width: "15%",
    },
    {
      header: "Tests",
      field: "tests",
      width: "40%",
    },
    {
      header: "Environment",
      field: "environmentDefinition.name",
      width: "20%",
    },
  ];

  ngOnInit() {
    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projectId) => {
          this.projectId = projectId;
          this.loadScenarioDefinitions();
        },
        error: (error) => {
          this.toastMessageService.showError(error);
          this.isLoading = false;
        },
      });
  }

  onScenarioDefinitionsActivityStatusChange() {
    this.loadScenarioDefinitions();
  }

  private loadScenarioDefinitions() {
    this.isLoading = true;
    this.testsToDisplay = {};
    this.scenarioDefinitions = [];

    forkJoin([
      this.scenarioDefinitionApiService.getScenarioDefinitions(
        this.projectId,
        this.selectedActivityStatus
      ),
      this.scenarioDefinitionApiService.getTestDefinitions(this.projectId),
      this.streamsService.getListOfBpcsByProjectId(this.projectId),
      this.environmentService.getEnvironmentDefinitions(this.projectId, true),
    ])
      .pipe(
        map(([scenarioDefinitions, testDefinitions, bpcs, environments]) =>
          scenarioDefinitions.map((scenarioDefinition) =>
            ScenarioDefinitionMapper.toScenarioDefinition(
              scenarioDefinition,
              testDefinitions,
              bpcs,
              environments
            )
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.scenarioDefinitions = data;

          this.testsToDisplay = {};
          data.forEach(({ id, tests }) => {
            this.testsToDisplay[id] = formatTests(tests);
          });

          this.isLoading = false;
        },
        error: (error) => {
          this.toastMessageService.showError(error);
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  clearSearchInput(): void {
    this.searchInput = "";
  }

  onScenarioDefinitionArchived(scenarioDefinitionId: string): void {
    this.scenarioDefinitions = this.scenarioDefinitions.filter(
      (sd) => sd.id !== scenarioDefinitionId
    );
    delete this.testsToDisplay[scenarioDefinitionId];
  }

  protected readonly ScenarioDefinitionActivityStatus =
    ScenarioDefinitionActivityStatus;
}
