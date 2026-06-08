import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DateDisplayComponent } from "./date-display.component";

describe("DateDisplayComponent", () => {
  let component: DateDisplayComponent;
  let fixture: ComponentFixture<DateDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DateDisplayComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display the date in medium format with time", () => {
    fixture.componentRef.setInput("date", "2026-01-15T10:30:00Z");
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toMatch(
      /Jan 15, 2026, \d{1,2}:\d{2}:\d{2}\s[AP]M/
    );
  });

  it("should display dash when date is undefined", () => {
    fixture.componentRef.setInput("date", undefined);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe("-");
  });
});
