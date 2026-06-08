import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TestCaseExecutionAnalysisStatusComponent } from "./test-case-execution-analysis-status.component";
import { TestCaseExecutionAnalysisStatus } from "./test-case-execution-analysis-status";

describe("Test case execution analysis status component", () => {
  let component: TestCaseExecutionAnalysisStatusComponent;
  let fixture: ComponentFixture<TestCaseExecutionAnalysisStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestCaseExecutionAnalysisStatusComponent],
    });
    fixture = TestBed.createComponent(TestCaseExecutionAnalysisStatusComponent);
    component = fixture.componentInstance;
  });

  const statuses = [
    {
      analysisStatus: TestCaseExecutionAnalysisStatus.PASSED,
      testId: "passed",
    },
    {
      analysisStatus: TestCaseExecutionAnalysisStatus.FAILED,
      testId: "failed",
    },
    {
      analysisStatus: TestCaseExecutionAnalysisStatus.INCIDENT_SENT,
      testId: "incident-sent",
    },
    {
      analysisStatus: TestCaseExecutionAnalysisStatus.CANCELLED,
      testId: "cancelled",
    },
    {
      analysisStatus: TestCaseExecutionAnalysisStatus.NA,
      testId: "na",
    },
  ];

  test.each(statuses)(
    "should display the correct status element for %s",
    ({ analysisStatus, testId }) => {
      component.status = analysisStatus;
      fixture.detectChanges();
      const statusDisplayElement = fixture.debugElement.query(
        By.css(`[data-testid="${testId}"]`)
      );
      expect(statusDisplayElement).toBeTruthy();

      statuses
        .filter(
          (filteredAnalysisStatus) =>
            filteredAnalysisStatus.analysisStatus !== analysisStatus
        )
        .forEach((otherStatus) => {
          const otherStatusDisplayElement = fixture.debugElement.query(
            By.css(`[data-testid="${otherStatus.testId}"]`)
          );
          expect(otherStatusDisplayElement).toBeFalsy();
        });
    }
  );
});
