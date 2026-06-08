import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BinaryImpactIntegrationStatusComponent } from "./binary-impact-integration-status.component";
import { BinaryImpactIntegrationStatus } from "./binary-impact-integration-status";

describe("Binary impact integration status component", () => {
  let component: BinaryImpactIntegrationStatusComponent;
  let fixture: ComponentFixture<BinaryImpactIntegrationStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BinaryImpactIntegrationStatusComponent],
    });
    fixture = TestBed.createComponent(BinaryImpactIntegrationStatusComponent);
    component = fixture.componentInstance;
  });

  const statuses = [
    {
      status: BinaryImpactIntegrationStatus.COMPLETED,
      testId: "completed",
    },
    {
      status: BinaryImpactIntegrationStatus.TRIGGERED,
      testId: "triggered",
    },
    {
      status: BinaryImpactIntegrationStatus.NOT_TO_BE_INTEGRATED,
      testId: "not-to-be-integrated",
    },
    {
      status: BinaryImpactIntegrationStatus.TO_BE_INTEGRATED,
      testId: "to-be-integrated",
    },
  ];

  test.each(statuses)(
    "should display the correct status element for %s",
    ({ status, testId }) => {
      component.status = status;
      fixture.detectChanges();
      const statusDisplayElement = fixture.debugElement.query(
        By.css(`[data-testid="${testId}"]`)
      );
      expect(statusDisplayElement).toBeTruthy();

      statuses
        .filter((filtered) => filtered.status !== status)
        .forEach((otherStatus) => {
          const otherStatusDisplayElement = fixture.debugElement.query(
            By.css(`[data-testid="${otherStatus.testId}"]`)
          );
          expect(otherStatusDisplayElement).toBeFalsy();
        });
    }
  );
});
