import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { TestExecutionStatusComponent } from "./test-execution-status.component";
import { TestExecutionStatus } from "@mxflow/test-management";

describe("Test result status component", () => {
  let component: TestExecutionStatusComponent;
  let fixture: ComponentFixture<TestExecutionStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestExecutionStatusComponent],
    });
    fixture = TestBed.createComponent(TestExecutionStatusComponent);
    component = fixture.componentInstance;
  });

  const statuses = [
    {
      status: TestExecutionStatus.PASSED,
      id: "test-case-passed-status",
    },
    {
      status: TestExecutionStatus.FAILED,
      id: "test-case-failed-status",
    },
    {
      status: TestExecutionStatus.UNDERWAY,
      id: "test-case-underway-status",
    },
    {
      status: TestExecutionStatus.QUEUED,
      id: "test-case-queued-status",
    },
    { status: TestExecutionStatus.NA, id: "test-case-na-status" },
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
});
