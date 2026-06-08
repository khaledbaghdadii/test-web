import { Component, inject, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Store } from "@ngrx/store";
import { concatMap, finalize, Subject, takeUntil } from "rxjs";

import { BusinessProcessChain, Stream } from "@mxflow/features/streams";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { Repository, RepositoryService } from "@mxflow/features/repository";
import { ToastMessageService } from "@mxflow/ui/alert";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { ButtonModule } from "primeng/button";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { TestSelectionTableComponent } from "../test-selection/test-selection-table/test-selection-table.component";
import { GetTimeoutDurationInHoursPipe } from "./pipe/get-timeout-duration-in-hours.pipe";
import { TestDefinition } from "@mxevolve/domains/test/model";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";

@Component({
  selector: "mxevolve-test-definition-details",
  templateUrl: "./test-definition-details.component.html",
  imports: [
    CardContainerModule,
    HeaderTitleModule,
    ButtonModule,
    ShowElementIfAuthorizedDirective,
    TestSelectionTableComponent,
    GetTimeoutDurationInHoursPipe,
    RouterModule,
  ],
})
export class TestDefinitionDetailsComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private repositoryService = inject(RepositoryService);
  private testDefinitionService = inject(TestDefinitionService);
  private toastMessageService = inject(ToastMessageService);

  private readonly destroy$ = new Subject();

  projectId: string;
  isLoading: boolean;
  testRepo: Repository;
  streams: Stream[];
  bpcs: BusinessProcessChain[];
  testDefinition: TestDefinition;
  testDefinitionId: string;

  ngOnInit(): void {
    this.isLoading = true;
    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(
        concatMap((projectId) => {
          this.projectId = projectId;
          return this.route.params;
        }),
        concatMap((routeParams) => {
          const testDefinitionId = routeParams["testDefinitionId"];
          return this.testDefinitionService.fetch(
            testDefinitionId,
            this.projectId
          );
        }),
        concatMap((testDefinition) => {
          this.testDefinition = testDefinition;
          this.testDefinitionId = testDefinition.id;
          return this.repositoryService.getRepoById(
            this.projectId,
            this.testDefinition.repoId
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.testRepo = data;
          this.isLoading = false;
        },
        error: (error) => {
          this.showErrorMessage(error);
          this.isLoading = false;
        },
      });
  }

  reloadTestDefinition() {
    this.isLoading = true;
    this.testDefinitionService
      .fetch(this.testDefinitionId, this.projectId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (td) => {
          this.testDefinition = td;
        },
        error: (error) => {
          this.showErrorMessage(error);
        },
      });
  }

  isTestDefinitionTimeoutValid(): boolean {
    return !!this.testDefinition && !!this.testDefinition.timeoutDuration;
  }

  ngOnDestroy(): void {
    this.destroy$.next({});
    this.destroy$.complete();
  }

  private showErrorMessage(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }
}
