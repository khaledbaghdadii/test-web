import { UpdateReferenceStatusComponent } from "./update-reference-status.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { UpdateReferenceStatus } from "../update-reference";

describe("Update reference status component", () => {
  let component: UpdateReferenceStatusComponent;
  let fixture: ComponentFixture<UpdateReferenceStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UpdateReferenceStatusComponent],
    });
    fixture = TestBed.createComponent(UpdateReferenceStatusComponent);
    component = fixture.componentInstance;
  });

  const statuses = [
    {
      status: UpdateReferenceStatus.PASSED,
      id: "update-reference-passed-status",
      icon: "pi-check-circle",
      displayText: "Passed",
    },
    {
      status: UpdateReferenceStatus.FAILED,
      id: "update-reference-failed-status",
      icon: "pi-times-circle",
      displayText: "Failed",
    },
    {
      status: UpdateReferenceStatus.UNDERWAY,
      id: "update-reference-underway-status",
      icon: "pi-clock",
      displayText: "Underway",
    },
    {
      status: UpdateReferenceStatus.QUEUED,
      id: "update-reference-queued-status",
      icon: "pi-list",
      displayText: "Queued",
    },
  ];

  test.each([
    ...statuses,
    {
      status: "UNKNOWN" as UpdateReferenceStatus,
      id: "update-reference-unknown-status",
      displayText: "UNKNOWN",
    },
  ])(
    "should display the correct template for %s status",
    ({ status, id, displayText }) => {
      component.status = status;
      fixture.detectChanges();
      const statusDisplayElement = fixture.debugElement.query(By.css(`#${id}`));
      expect(statusDisplayElement).toBeTruthy();
      expect(
        statusDisplayElement.nativeElement.querySelector("h4").textContent
      ).toEqual(displayText);
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

  test.each(statuses)(
    "should display the correct icon for %s status",
    ({ status, id, icon }) => {
      component.status = status;
      fixture.detectChanges();
      const statusDisplayElement = fixture.debugElement.query(By.css(`#${id}`));
      expect(
        Array.from(
          statusDisplayElement.nativeElement.querySelector("i").classList
        )
      ).toContain(icon);
    }
  );
});
