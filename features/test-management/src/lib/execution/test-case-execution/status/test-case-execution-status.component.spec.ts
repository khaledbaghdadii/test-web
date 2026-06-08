import { TestCaseExecutionStatusComponent } from "./test-case-execution-status.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TestCaseExecutionStatus } from "./test-case-execution-status";
import { By } from "@angular/platform-browser";

describe("Test case execution status component", () => {
  let component: TestCaseExecutionStatusComponent;
  let fixture: ComponentFixture<TestCaseExecutionStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestCaseExecutionStatusComponent],
    });
    fixture = TestBed.createComponent(TestCaseExecutionStatusComponent);
    component = fixture.componentInstance;
  });

  const statuses = [
    {
      status: TestCaseExecutionStatus.PASSED,
      id: "test-case-execution-passed-status",
    },
    {
      status: TestCaseExecutionStatus.FAILED,
      id: "test-case-execution-failed-status",
    },
    {
      status: TestCaseExecutionStatus.UNDERWAY,
      id: "test-case-execution-underway-status",
    },
    {
      status: TestCaseExecutionStatus.NOT_STARTED,
      id: "test-case-execution-not-started-status",
    },
    { status: TestCaseExecutionStatus.NA, id: "test-case-execution-na-status" },
    {
      status: "UNKNOWN" as TestCaseExecutionStatus,
      id: "test-case-execution-unknown-status",
    },
  ];

  test.each(statuses)(
    "should display the correct status element for %s",
    ({ status, id }) => {
      component.status = status;
      fixture.detectChanges();
      const statusDisplayElement = fixture.debugElement.query(By.css(`#${id}`));
      expect(statusDisplayElement).toBeTruthy();

      statuses
        .filter((status) => status.id !== id)
        .forEach((otherStatus) => {
          const otherStatusDisplayElement = fixture.debugElement.query(
            By.css(`#${otherStatus.id}`)
          );
          expect(otherStatusDisplayElement).toBeFalsy();
        });
    }
  );

  it("should have skipped status defined", () => {
    expect(TestCaseExecutionStatus.SKIPPED).toBeTruthy();
  });
});
