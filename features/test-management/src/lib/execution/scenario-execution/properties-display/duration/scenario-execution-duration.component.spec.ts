import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ScenarioExecutionDurationComponent } from "./scenario-execution-duration.component";
import { By } from "@angular/platform-browser";

describe("scenario execution duration component", () => {
  let component: ScenarioExecutionDurationComponent;
  let fixture: ComponentFixture<ScenarioExecutionDurationComponent>;

  const START_TIME = "2023-10-01T10:00:00Z";
  const END_TIME = "2023-10-01T10:05:30Z";

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScenarioExecutionDurationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScenarioExecutionDurationComponent);
    component = fixture.componentInstance;
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should display the duration when both startTime and endTime are provided", () => {
    component.startTime = START_TIME;
    component.endTime = END_TIME;

    fixture.detectChanges();

    expect(getDurationElement().textContent.trim()).toBe("0h 5m 30s");
  });

  it.each([undefined, null])(
    "should display '-' when endTime is not provided",
    (falsyEndTime: null | undefined) => {
      component.startTime = START_TIME;
      component.endTime = falsyEndTime;
      fixture.detectChanges();

      expect(getDurationElement().textContent.trim()).toBe("-");
    }
  );

  function getDurationElement() {
    return fixture.debugElement.query(By.css("#duration")).nativeElement;
  }
});
