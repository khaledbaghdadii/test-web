import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { Store } from "@ngrx/store";
import { concatMap, Subject, takeUntil } from "rxjs";
import { GlobalSelectors } from "@mxflow/core/global-store";
import { ToastMessageService } from "@mxflow/ui/alert";
import { CardContainerModule } from "@mxflow/ui/container";
import { HeaderTitleModule } from "@mxflow/ui/header";
import { IconField } from "primeng/iconfield";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { RouterModule } from "@angular/router";
import { SkeletonModule } from "primeng/skeleton";
import { TestDefinitionTableSearchPipe } from "./test-definition-table-search.pipe";
import { FormsModule } from "@angular/forms";
import { InputIcon } from "primeng/inputicon";
import { ShowElementIfAuthorizedDirective } from "@mxflow/core/auth";
import { InputTextModule } from "primeng/inputtext";
import { TestDefinitionService } from "@mxevolve/domains/test/data-access";
import { TestDefinition } from "@mxevolve/domains/test/model";

@Component({
  selector: "mxevolve-test-definitions-table",
  templateUrl: "./test-definitions-table.component.html",
  imports: [
    CardContainerModule,
    HeaderTitleModule,
    IconField,
    InputIcon,
    ButtonModule,
    TableModule,
    RouterModule,
    SkeletonModule,
    TestDefinitionTableSearchPipe,
    FormsModule,
    ShowElementIfAuthorizedDirective,
    InputTextModule,
  ],
})
export class TestDefinitionsTableComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly testDefinitionService = inject(TestDefinitionService);
  private readonly toastMessageService = inject(ToastMessageService);

  private readonly destroy$ = new Subject();

  searchInput = "";
  isLoading: boolean;
  testDefinitions: TestDefinition[] = [];

  listOfColumn = [
    {
      header: "Name",
      field: "name",
      width: "25%",
    },
    {
      header: "Path",
      field: "path",
      width: "45%",
    },
    {
      header: "Description",
      field: "description",
      width: "25%",
    },
  ];

  ngOnInit(): void {
    this.isLoading = true;
    this.store
      .select(GlobalSelectors.getProjectId)
      .pipe(
        concatMap((projectId) => {
          return this.testDefinitionService.fetchAll(projectId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => {
          this.testDefinitions = data;
          this.isLoading = false;
        },
        error: (error) => {
          this.showErrorMessage(error);
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

  private showErrorMessage(errorMessage: string) {
    this.toastMessageService.showError(errorMessage);
  }

  protected readonly Array = Array;
}
