import { MockBuilder, MockedComponentFixture, MockRender } from "ng-mocks";
import { TestCaseExecutionDisplayComponent } from "./test-case-execution-display.component";
import { TestCaseExecution } from "../test-case-execution";
import { JIRA_CONFIG, JiraConfig } from "@mxflow/config";
import { TestCaseExecutionDisplayPipe } from "@mxflow/test-management";
import { getTooltipTextByTestId } from "@mxevolve/testing";
import { Tooltip } from "primeng/tooltip";

describe("TestCaseExecutionDisplayComponent", () => {
  let component: TestCaseExecutionDisplayComponent;
  let fixture: MockedComponentFixture<
    TestCaseExecutionDisplayComponent,
    { testCaseExecutions: TestCaseExecution[] }
  >;
  const TEST_CASE_EXECUTION_DISPLAY_PIPE_OUTPUT = `Test Case 1 (TC001), Test Case 2 (TC002)`;

  const mockJiraConfig: JiraConfig = {
    functionalTestCaseBaseUrl: "https://jira.example.com/browse/",
  } as JiraConfig;

  beforeEach(async () => {
    await MockBuilder(TestCaseExecutionDisplayComponent)
      .provide({
        provide: JIRA_CONFIG,
        useValue: mockJiraConfig,
      })
      .keep(Tooltip)
      .mock(
        TestCaseExecutionDisplayPipe,
        () => TEST_CASE_EXECUTION_DISPLAY_PIPE_OUTPUT
      );
  });

  const normalizeWhitespace = (text: string): string =>
    text.replace(/\s+/g, " ").trim();

  it("should create", () => {
    fixture = MockRender(TestCaseExecutionDisplayComponent, {
      testCaseExecutions: [],
    });
    component = fixture.point.componentInstance;
    expect(component).toBeTruthy();
  });

  it.each([
    [null as unknown as TestCaseExecution[]],
    [undefined as unknown as TestCaseExecution[]],
    [[]],
  ])(
    "should display dash when no test case executions are passed",
    (testCaseExecutions) => {
      fixture = MockRender(TestCaseExecutionDisplayComponent, {
        testCaseExecutions,
      });
      expect(normalizeWhitespace(fixture.nativeElement.textContent)).toBe("-");
    }
  );

  it("should display single test case execution with correct format 'title (ftc id link)'", () => {
    fixture = MockRender(TestCaseExecutionDisplayComponent, {
      testCaseExecutions: [
        {
          title: "Test Case 1",
          functionalTestCaseId: "TC001",
        },
      ] as TestCaseExecution[],
    });

    const link = fixture.nativeElement.querySelector("a");
    expect(link).toBeTruthy();
    expect(link.textContent).toBe("TC001");
    expect(link.getAttribute("href")).toBe(
      "https://jira.example.com/browse/TC001"
    );
    expect(link.getAttribute("target")).toBe("_blank");

    const textContent = normalizeWhitespace(fixture.nativeElement.textContent);
    expect(textContent).toBe("Test Case 1 (TC001)");
  });

  it("should display multiple test case executions separated by commas", () => {
    fixture = MockRender(TestCaseExecutionDisplayComponent, {
      testCaseExecutions: [
        {
          title: "Test Case 1",
          functionalTestCaseId: "TC001",
        },
        {
          title: "Test Case 2",
          functionalTestCaseId: "TC002",
        },
      ] as TestCaseExecution[],
    });

    const links = fixture.nativeElement.querySelectorAll("a");
    expect(links.length).toBe(2);

    expect(links[0].textContent).toBe("TC001");
    expect(links[0].getAttribute("href")).toBe(
      "https://jira.example.com/browse/TC001"
    );
    expect(links[1].textContent).toBe("TC002");
    expect(links[1].getAttribute("href")).toBe(
      "https://jira.example.com/browse/TC002"
    );

    const textContent = normalizeWhitespace(fixture.nativeElement.textContent);
    expect(textContent).toBe("Test Case 1 (TC001), Test Case 2 (TC002)");
  });

  it("should open links in new tab", () => {
    fixture = MockRender(TestCaseExecutionDisplayComponent, {
      testCaseExecutions: [
        {
          title: "Test Case 1",
          functionalTestCaseId: "TC001",
        },
        {
          title: "Test Case 2",
          functionalTestCaseId: "TC002",
        },
      ] as TestCaseExecution[],
    });

    const links = fixture.nativeElement.querySelectorAll("a");
    links.forEach((link: HTMLAnchorElement) => {
      expect(link.getAttribute("target")).toBe("_blank");
    });
  });

  it("should display a tooltip with all the test case execution names and ftc ids separated by a comma", () => {
    fixture = MockRender(TestCaseExecutionDisplayComponent, {
      testCaseExecutions: [
        {
          title: "Test Case 1",
          functionalTestCaseId: "TC001",
        },
        {
          title: "Test Case 2",
          functionalTestCaseId: "TC002",
        },
      ] as TestCaseExecution[],
    });

    fixture.detectChanges();

    expect(getTooltipTextByTestId(fixture, "test-case-executions")).toBe(
      TEST_CASE_EXECUTION_DISPLAY_PIPE_OUTPUT
    );
  });
});
