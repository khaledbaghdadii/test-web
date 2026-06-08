import {
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  input,
  Input,
  model,
  Output,
  signal,
  Signal,
} from "@angular/core";

import { TestCaseExecution } from "../test-case-execution";
import { TableModule } from "primeng/table";
import { Skeleton } from "primeng/skeleton";
import { TableCheckboxFilterComponent } from "@mxflow/ui/utils";
import {
  TestCaseExecutionStatus,
  TestCaseExecutionStatusDisplayValue,
} from "../status/test-case-execution-status";
import { TestCaseExecutionStatusComponent } from "../status/test-case-execution-status.component";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { Tooltip } from "primeng/tooltip";

@Component({
  selector: "mxevolve-test-case-execution-selection-table",
  imports: [
    TableModule,
    Skeleton,
    TableCheckboxFilterComponent,
    TestCaseExecutionStatusComponent,
    Tooltip,
  ],
  templateUrl: "./test-case-execution-selection-table.component.html",
})
export class TestCaseExecutionSelectionTableComponent {
  stateService = inject(ScenarioExecutionStateManagementService);

  testCaseExecutions = input<TestCaseExecution[]>([]);

  @Input() isLoading = false;
  @Input() testCaseExecutionsSelection: TestCaseExecution[] = [];
  @Output() testCaseExecutionsSelectionChange = new EventEmitter<
    TestCaseExecution[]
  >();

  statusFilterOptions = Object.values(TestCaseExecutionStatus)
    .filter((status) => status !== TestCaseExecutionStatus.SKIPPED)
    .map((status) => ({
      text: TestCaseExecutionStatusDisplayValue[status],
      value: status,
    }));

  selectedStatusFilters = model<string[]>([
    TestCaseExecutionStatus.FAILED,
    TestCaseExecutionStatus.UNDERWAY,
  ]);

  selectedTestExecutionFilters = model<string[]>([]);

  filters = signal({});

  constructor() {
    effect(() => {
      const selectedStatuses = this.selectedStatusFilters();
      const selectedTestExecutions = this.selectedTestExecutionFilters();

      this.filters.update((currentFilters) => ({
        ...currentFilters,
        status: [
          {
            value: selectedStatuses,
            matchMode: "in",
          },
        ],
        testExecutionId: [
          {
            value: selectedTestExecutions,
            matchMode: "in",
          },
        ],
      }));
    });
  }

  testExecutionFilterOptions = computed(() => {
    return this.stateService
      .scenarioExecution()
      .testExecutions.map((testExecution) => {
        const testSelectionNames = this.getTestSelectionNames(testExecution.id);
        return {
          text: this.getTestPackageDefinitionName(
            testExecution.testPackageDefinitionName,
            testSelectionNames
          ),
          value: testExecution.id,
        };
      });
  });

  testExecutions = computed(
    () =>
      new Map(
        this.stateService
          .scenarioExecution()
          .testExecutions.map((testExecution) => [
            testExecution.id,
            testExecution,
          ])
      )
  );

  testCaseExecutionSelected(testCaseExecutions: TestCaseExecution[]) {
    this.testCaseExecutionsSelectionChange.emit(testCaseExecutions);
  }

  testCaseExecutionsTableData: Signal<TestCaseExecutionData[]> = computed(() =>
    this.testCaseExecutions().map((testCaseExecution) => {
      const testSelectionNames = this.getTestSelectionNames(
        testCaseExecution.testExecutionId
      );
      return {
        ...testCaseExecution,
        testPackageDefinitionName: this.getTestPackageDefinitionName(
          this.testExecutions().get(testCaseExecution.testExecutionId)
            ?.testPackageDefinitionName ?? "",
          testSelectionNames
        ),
        testSelectionNames: testSelectionNames,
      } as TestCaseExecutionData;
    })
  );

  private getTestPackageDefinitionName(
    testDefinitionName: string,
    testSelectionNames: string
  ) {
    if (!testSelectionNames) {
      return testDefinitionName;
    }

    return `${testDefinitionName} (${testSelectionNames})`;
  }

  private getTestSelectionNames(testExecutionId: string) {
    return (
      this.testExecutions()
        .get(testExecutionId)
        ?.testSelectionNames.join(", ") ?? ""
    );
  }
}

interface TestCaseExecutionData extends TestCaseExecution {
  testPackageDefinitionName: string;
  testSelectionNames: string;
}
