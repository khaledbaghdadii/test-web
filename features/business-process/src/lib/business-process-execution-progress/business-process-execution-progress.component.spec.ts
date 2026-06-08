import { ComponentFixture, TestBed } from "@angular/core/testing";
import { BusinessProcessExecutionProgressComponent } from "./business-process-execution-progress.component";

describe("BusinessProcessExecutionProgressComponent", () => {
  let component: BusinessProcessExecutionProgressComponent;
  let fixture: ComponentFixture<BusinessProcessExecutionProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessProcessExecutionProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(
      BusinessProcessExecutionProgressComponent
    );
    component = fixture.componentInstance;
    component.executionStages = [];
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("given the process is active and it has not reached its expiry date it should show corresponding tags in the process", () => {
    component.expiryDate = "2025-10-15T14:29:00.976Z";
    component.endDate = "";
    component.notStarted = false;
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-01T14:29:00.976Z"));

    fixture.detectChanges();

    expect(component.isActive).toBe(true);
  });

  it("given the process does not have an expiry date it should not show any tags", () => {
    component.endDate = "";
    component.notStarted = false;
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-01T14:29:00.976Z"));

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const tagElement = compiled.querySelector("mxevolve-expiry-date-tag");
    expect(tagElement).toBeNull();
  });
});
