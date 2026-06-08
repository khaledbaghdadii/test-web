import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { DurationDisplayComponent } from "./duration-display.component";

@Component({
  standalone: true,
  imports: [DurationDisplayComponent],
  template: `<mxevolve-duration-display
    [startDate]="startDate"
    [endDate]="endDate"
  ></mxevolve-duration-display>`,
})
class TestHostComponent {
  startDate: string | undefined;
  endDate: string | undefined;
}

describe("DurationDisplayComponent", () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
  });

  it("renders a dash when start date is undefined", () => {
    hostComponent.startDate = undefined;
    hostComponent.endDate = "2026-01-15T11:00:00Z";
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });

  it("renders a dash when end date is undefined", () => {
    hostComponent.startDate = "2026-01-15T10:00:00Z";
    hostComponent.endDate = undefined;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });

  it("renders a dash when both dates are undefined", () => {
    hostComponent.startDate = undefined;
    hostComponent.endDate = undefined;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });

  it("renders a dash when start date is invalid", () => {
    hostComponent.startDate = "invalid-date";
    hostComponent.endDate = "2026-01-15T11:00:00Z";
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });

  it("renders seconds only for short durations", () => {
    hostComponent.startDate = "2026-01-15T10:00:00Z";
    hostComponent.endDate = "2026-01-15T10:00:45Z";
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("0h 0m 45s");
  });

  it("renders minutes and seconds", () => {
    hostComponent.startDate = "2026-01-15T10:00:00Z";
    hostComponent.endDate = "2026-01-15T10:05:30Z";
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("0h 5m 30s");
  });

  it("renders hours and minutes", () => {
    hostComponent.startDate = "2026-01-15T10:00:00Z";
    hostComponent.endDate = "2026-01-15T12:30:00Z";
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("2h 30m 0s");
  });

  it("renders a dash when duration is negative", () => {
    hostComponent.startDate = "2026-01-15T12:00:00Z";
    hostComponent.endDate = "2026-01-15T10:00:00Z";
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });

  it("renders zero duration for identical dates", () => {
    hostComponent.startDate = "2026-01-15T10:00:00Z";
    hostComponent.endDate = "2026-01-15T10:00:00Z";
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe("0h 0m 0s");
  });
});
