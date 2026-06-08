import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TestCaseExecutionSelectionTableComponent } from "./test-case-execution-selection-table.component";
import { By } from "@angular/platform-browser";
import { TestCaseExecution } from "../test-case-execution";
import {
  TestCaseExecutionStatus,
  TestCaseExecutionStatusDisplayValue,
} from "../status/test-case-execution-status";
import {
  testCaseExecution1,
  testCaseExecution2,
  testCaseExecution3,
} from "../test-case-execution-utils";
import { ScenarioExecutionStateManagementService } from "../../scenario-execution/scenario-execution-details/scenario-execution-state-management.service";
import { signal } from "@angular/core";
import {
  ScenarioExecution,
  TestExecution,
} from "../../scenario-execution/scenario-execution";
import { DomTestUtils } from "@mxevolve/testing";

describe("TestCaseExecutionSelectionTableComponent", () => {
  let component: TestCaseExecutionSelectionTableComponent;
  let fixture: ComponentFixture<TestCaseExecutionSelectionTableComponent>;

  let stateService: ScenarioExecutionStateManagementService;
  const scenarioExecutionMock = signal(getScenarioExecution());

  beforeEach(async () => {
    stateService = {
      scenarioExecution: scenarioExecutionMock,
    } as unknown as ScenarioExecutionStateManagementService;

    await TestBed.configureTestingModule({
      imports: [TestCaseExecutionSelectionTableComponent],
      providers: [
        {
          provide: ScenarioExecutionStateManagementService,
          useValue: stateService,
        },
      ],
    }).compileComponents();

    scenarioExecutionMock.set(getScenarioExecution());

    fixture = TestBed.createComponent(TestCaseExecutionSelectionTableComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      "testCaseExecutions",
      getTestCaseExecutions()
    );

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("on loading data", () => {
    it("should set isLoading to true", () => {
      component.isLoading = true;
      expect(component.isLoading).toBeTruthy();
    });

    it("should set isLoading to false", () => {
      component.isLoading = false;
      expect(component.isLoading).toBeFalsy();
    });

    it("should set total to the length of testCaseExecutions with default status filtering", () => {
      fixture.componentRef.setInput(
        "testCaseExecutions",
        getTestCaseExecutions()
      );
      expect(getTableHarness().getTotalRecords()).toBe(3);
    });

    it("should not display loading template when data is ready", () => {
      const loadingSkeletons = fixture.debugElement.queryAll(
        By.css("p-skeleton")
      );
      expect(loadingSkeletons.length).toBe(0);
    });

    it("should display loading template on loading", () => {
      component.isLoading = true;
      fixture.detectChanges();
      const loadingSkeletons = fixture.debugElement.queryAll(
        By.css("p-skeleton")
      );
      expect(loadingSkeletons.length).toBeGreaterThan(0);
    });
  });

  describe("on test case execution selection", () => {
    it("should emit event with selected test case executions", () => {
      const emitSpy = jest.spyOn(
        component.testCaseExecutionsSelectionChange,
        "emit"
      );
      fixture.componentRef.setInput(
        "testCaseExecutions",
        getTestCaseExecutions()
      );
      const selectedTestCaseExecutions = getSelectedTestCaseExecutions();
      component.testCaseExecutionSelected(selectedTestCaseExecutions);
      expect(emitSpy).toHaveBeenCalledWith(selectedTestCaseExecutions);
    });

    it("should call the testCaseExecutionSelected method on selection change", () => {
      const handlerSpy = jest.spyOn(component, "testCaseExecutionSelected");
      getTableHarness().emitSelectionChange(getSelectedTestCaseExecutions());
      expect(handlerSpy).toHaveBeenCalledWith(getSelectedTestCaseExecutions());
    });
  });

  describe("filter test case executions", () => {
    describe("filter on status", () => {
      it("should initialize the status filter options correctly", () => {
        expect(component.statusFilterOptions).toEqual([
          {
            text: TestCaseExecutionStatusDisplayValue[
              TestCaseExecutionStatus.NOT_STARTED
            ],
            value: TestCaseExecutionStatus.NOT_STARTED,
          },
          {
            text: TestCaseExecutionStatusDisplayValue[
              TestCaseExecutionStatus.UNDERWAY
            ],
            value: TestCaseExecutionStatus.UNDERWAY,
          },
          {
            text: TestCaseExecutionStatusDisplayValue[
              TestCaseExecutionStatus.PASSED
            ],
            value: TestCaseExecutionStatus.PASSED,
          },
          {
            text: TestCaseExecutionStatusDisplayValue[
              TestCaseExecutionStatus.FAILED
            ],
            value: TestCaseExecutionStatus.FAILED,
          },
          {
            text: TestCaseExecutionStatusDisplayValue[
              TestCaseExecutionStatus.NA
            ],
            value: TestCaseExecutionStatus.NA,
          },
        ]);
      });

      it("should prefilter on test cases with failed and underway statuses and highlight the filter", () => {
        fixture.componentRef.setInput("testCaseExecutions", [
          { ...testCaseExecution1, status: TestCaseExecutionStatus.UNDERWAY },
          { ...testCaseExecution2, status: TestCaseExecutionStatus.FAILED },
          { ...testCaseExecution3, status: TestCaseExecutionStatus.PASSED },
        ]);

        expect(getTableHarness().getRowsCount()).toBe(2);
        expect(
          getTableHarness().isCheckboxColumnFilterActive(
            "status-selection-filter"
          )
        ).toBe(true);
      });

      it("should filter on test cases based on selected statuses and highlight the filter", () => {
        fixture.componentRef.setInput("testCaseExecutions", [
          { ...testCaseExecution1, status: TestCaseExecutionStatus.UNDERWAY },
          { ...testCaseExecution2, status: TestCaseExecutionStatus.FAILED },
          { ...testCaseExecution3, status: TestCaseExecutionStatus.PASSED },
        ]);
        getTableHarness().applyCheckboxColumnFilterById(
          "status-selection-filter",
          [TestCaseExecutionStatus.PASSED]
        );

        expect(getTableHarness().getRowsCount()).toBe(1);
        expect(
          getTableHarness().isCheckboxColumnFilterActive(
            "status-selection-filter"
          )
        ).toBe(true);
      });

      it("should display all test cases when status filter is cleared and remove the filter highlight", () => {
        fixture.componentRef.setInput("testCaseExecutions", [
          { ...testCaseExecution1, status: TestCaseExecutionStatus.UNDERWAY },
          { ...testCaseExecution2, status: TestCaseExecutionStatus.FAILED },
          { ...testCaseExecution3, status: TestCaseExecutionStatus.PASSED },
        ]);

        getTableHarness().applyCheckboxColumnFilterById(
          "status-selection-filter",
          [TestCaseExecutionStatus.PASSED, TestCaseExecutionStatus.UNDERWAY]
        );

        getTableHarness().applyCheckboxColumnFilterById(
          "status-selection-filter",
          []
        );

        expect(getTableHarness().getRowsCount()).toBe(3);
        expect(
          getTableHarness().isCheckboxColumnFilterActive(
            "status-selection-filter"
          )
        ).toBe(false);
      });
    });

    describe("filter on test execution", () => {
      beforeEach(() => {
        component.selectedStatusFilters.set([]);
      });

      it("should set the test execution filter options if there are no test selections", () => {
        scenarioExecutionMock.set({
          testExecutions: [
            {
              id: "testExecutionId1",
              testPackageDefinitionName: "Test Package 1",
              testSelectionNames: [],
            },
            {
              id: "testExecutionId2",
              testPackageDefinitionName: "Test Package 2",
              testSelectionNames: [],
            },
          ] as unknown[] as TestExecution[],
        } as ScenarioExecution);
        const expectedOptions = [
          {
            text: "Test Package 1",
            value: "testExecutionId1",
          },
          {
            text: "Test Package 2",
            value: "testExecutionId2",
          },
        ];
        expect(component.testExecutionFilterOptions()).toEqual(expectedOptions);
      });

      it("should set the test execution filter options if some contain one or more test selections", () => {
        scenarioExecutionMock.set({
          testExecutions: [
            {
              id: "testExecutionId1",
              testPackageDefinitionName: "Test Package 1",
              testSelectionNames: ["Test 1", "Test 2"],
            },
            {
              id: "testExecutionId2",
              testPackageDefinitionName: "Test Package 2",
              testSelectionNames: [],
            },
            {
              id: "testExecutionId3",
              testPackageDefinitionName: "Test Package 3",
              testSelectionNames: ["Test Selection 1"],
            },
          ] as unknown[] as TestExecution[],
        } as ScenarioExecution);
        const expectedOptions = [
          {
            text: "Test Package 1 (Test 1, Test 2)",
            value: "testExecutionId1",
          },
          {
            text: "Test Package 2",
            value: "testExecutionId2",
          },
          {
            text: "Test Package 3 (Test Selection 1)",
            value: "testExecutionId3",
          },
        ];
        expect(component.testExecutionFilterOptions()).toEqual(expectedOptions);
      });

      it("should prefilter test case executions based on the currently viewed test execution and highlight its filter", () => {
        fixture.componentRef.setInput("selectedTestExecutionFilters", [
          "testExecutionId1",
        ]);
        fixture.componentRef.setInput("testCaseExecutions", [
          { ...testCaseExecution1, testExecutionId: "testExecutionId1" },
          { ...testCaseExecution2, testExecutionId: "testExecutionId2" },
          { ...testCaseExecution3, testExecutionId: "testExecutionId3" },
        ]);
        fixture.detectChanges();

        expect(getTableHarness().getRowsCount()).toBe(1);
        expect(
          getTableHarness().isCheckboxColumnFilterActive(
            "test-execution-selection-filter"
          )
        ).toBe(true);
      });

      it("should filter test case executions by selected test executions and highlight its filter", () => {
        fixture.componentRef.setInput("testCaseExecutions", [
          { ...testCaseExecution1, testExecutionId: "testExecutionId1" },
          { ...testCaseExecution2, testExecutionId: "testExecutionId2" },
          { ...testCaseExecution3, testExecutionId: "testExecutionId3" },
        ]);
        fixture.detectChanges();

        getTableHarness().applyCheckboxColumnFilterById(
          "test-execution-selection-filter",
          ["testExecutionId1"]
        );

        expect(getTableHarness().getRowsCount()).toBe(1);
        expect(
          getTableHarness().isCheckboxColumnFilterActive(
            "test-execution-selection-filter"
          )
        ).toBe(true);
      });

      it("should show empty list of test case executions in case none match", () => {
        const testExecutionId1 = "testExecutionId1";
        const testExecutionId2 = "testExecutionId2";
        fixture.componentRef.setInput("testCaseExecutions", [
          { ...testCaseExecution1, testExecutionId: testExecutionId1 },
          { ...testCaseExecution2, testExecutionId: testExecutionId2 },
          { ...testCaseExecution3, testExecutionId: testExecutionId1 },
        ]);

        getTableHarness().applyCheckboxColumnFilterById(
          "test-execution-selection-filter",
          ["batata"]
        );
        expect(getTableHarness().getRowsCount()).toBe(0);
      });

      it("should display all test cases when the test execution filter is cleared and remove its highlight", () => {
        fixture.componentRef.setInput("testCaseExecutions", [
          testCaseExecution1,
          testCaseExecution2,
          testCaseExecution3,
        ]);

        fixture.detectChanges();

        getTableHarness().applyCheckboxColumnFilterById(
          "test-execution-selection-filter",
          ["testExecutionId1"]
        );
        getTableHarness().applyCheckboxColumnFilterById(
          "test-execution-selection-filter",
          []
        );

        expect(getTableHarness().getRowsCount()).toBe(3);
        expect(
          getTableHarness().isCheckboxColumnFilterActive(
            "test-execution-selection-filter"
          )
        ).toBe(false);
      });
    });

    it("should filter on both status and test execution", () => {
      fixture.componentRef.setInput("testCaseExecutions", [
        {
          id: "1",
          status: TestCaseExecutionStatus.PASSED,
          testExecutionId: "testExecutionId1",
        },
        {
          id: "2",
          status: TestCaseExecutionStatus.FAILED,
          testExecutionId: "testExecutionId1",
        },
        {
          id: "3",
          status: TestCaseExecutionStatus.UNDERWAY,
          testExecutionId: "testExecutionId2",
        },
        {
          id: "4",
          status: TestCaseExecutionStatus.UNDERWAY,
          testExecutionId: "testExecutionId3",
        },
      ] as TestCaseExecution[]);

      getTableHarness().applyCheckboxColumnFilterById(
        "status-selection-filter",
        [TestCaseExecutionStatus.UNDERWAY]
      );
      getTableHarness().applyCheckboxColumnFilterById(
        "test-execution-selection-filter",
        ["testExecutionId3"]
      );
      fixture.detectChanges();

      expect(getTableHarness().getRowsCount()).toEqual(1);
    });
  });

  it("should have a column for test package execution", () => {
    const headers = fixture.debugElement.queryAll(By.css("th"));
    const headerTexts = headers.map((header) =>
      header.nativeElement.textContent.trim()
    );
    expect(headerTexts).toContain("Test Execution");
  });

  it("should display test package execution name in the table", () => {
    const rows = fixture.debugElement.queryAll(
      By.css("#table-text-execution-row")
    );
    const rowTexts = rows.map((row) => row.nativeElement.textContent.trim());

    expect(rowTexts[1]).toBe("Test Package 2");
  });

  it("should display test selections beside test package execution name if they exist", () => {
    const rows = fixture.debugElement.queryAll(
      By.css("#table-text-execution-row")
    );
    const rowTexts = rows.map((row) => row.nativeElement.textContent.trim());

    expect(rowTexts[0]).toBe("Test Package 1 (Test 1, Test 2)");
  });

  it("should wrap long test package execution names", () => {
    const row = fixture.debugElement.queryAll(
      By.css("#table-text-execution-row")
    )[0];

    expect(row.classes["max-w-64"]).toBeTruthy();
    expect(row.classes["truncate"]).toBeTruthy();
  });

  it("should display test selection names in the tooltip", () => {
    const rows = fixture.debugElement.queryAll(By.css("td"));
    const testPackage1Element = rows.find((row) =>
      row.nativeElement.textContent.includes("Test Package 1")
    );
    const spanAttributes = testPackage1Element?.query(By.css("span"))
      .nativeElement.textContent;
    expect(spanAttributes).toContain("Test 1, Test 2");
  });

  function getTableHarness() {
    return DomTestUtils.getTableByTestId(
      fixture,
      "test-case-executions-selection-table"
    );
  }
});

function getScenarioExecution() {
  return {
    testExecutions: [
      {
        id: "testExecutionId1",
        testPackageDefinitionName: "Test Package 1",
        testSelectionNames: ["Test 1", "Test 2"],
      },
      {
        id: "testExecutionId2",
        testPackageDefinitionName: "Test Package 2",
        testSelectionNames: [],
      },
      {
        id: "testExecutionId3",
        testPackageDefinitionName: "Test Package 3",
        testSelectionNames: ["Test Selection 1", "Test Selection 2"],
      },
    ] as TestExecution[],
  } as unknown as ScenarioExecution;
}

function getTestCaseExecutions() {
  return [
    {
      id: "1",
      title: "Test Case 1",
      status: TestCaseExecutionStatus.PASSED,
      testExecutionId: "testExecutionId1",
    },
    {
      id: "2",
      title: "Test Case 2",
      status: TestCaseExecutionStatus.FAILED,
      testExecutionId: "testExecutionId1",
    },
    {
      id: "3",
      title: "Test Case 3",
      status: TestCaseExecutionStatus.UNDERWAY,
      testExecutionId: "testExecutionId2",
    },
    {
      id: "4",
      title: "Test Case 4",
      status: TestCaseExecutionStatus.UNDERWAY,
      testExecutionId: "testExecutionId3",
    },
  ] as TestCaseExecution[];
}

function getSelectedTestCaseExecutions() {
  return [
    {
      id: "1",
      title: "Test Case 1",
      status: TestCaseExecutionStatus.PASSED,
    },
    {
      id: "2",
      title: "Test Case 2",
      status: TestCaseExecutionStatus.FAILED,
    },
  ] as TestCaseExecution[];
}
